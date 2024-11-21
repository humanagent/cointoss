import { v4 as uuidv4 } from "uuid";
import { skillAction, XMTPContext, getUserInfo } from "@xmtp/message-kit";
import { privateKeyToAccount } from "viem/accounts";
import { GROUP_MESSAGE_FIRST } from "../lib/constants.js";
import { base } from "viem/chains";
import { getRedisClient } from "../lib/redis.js";
import { db } from "../lib/db.js";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { COINTOSSBOT_ABI } from "../lib/abi.js";
import { frameUrl } from "../index.js";

export const registerSkill: skillAction[] = [
  {
    skill:
      "/toss [description] [options (separated by comma)] [amount] [judge(optional)] [endTime(optional)]",
    description:
      "Create a toss with a description, options, amount and judge(optional).",
    handler: handleTossCreation,
    examples: [
      "/toss 'Shane vs John at pickeball' 'Yes,No' 10",
      "/toss 'Will argentina win the world cup' 'Yes,No' 10",
      "/toss 'Race to the end' 'Fabri,John' 10 @fabri",
      "/toss 'Will argentina win the world cup' 'Yes,No' 5 '27 Oct 2023 23:59:59 GMT'",
      "/toss 'Will the niks win on sunday?' 'Yes,No' 10 vitalik.eth '27 Oct 2023 23:59:59 GMT'",
      "/toss 'Will it rain tomorrow' 'Yes,No' 0",
    ],
    params: {
      description: {
        type: "quoted",
      },
      options: {
        default: "Yes, No",
        type: "quoted",
      },
      amount: {
        type: "number",
      },
      judge: {
        type: "username",
      },
      endTime: {
        type: "quoted",
      },
    },
  },
];

export async function handleTossCreation(context: XMTPContext) {
  const {
    message: {
      content: { params },
      sender,
    },
    group,
  } = context;

  if (params.description && params.options && !isNaN(Number(params.amount))) {
    //await context.send("one sec...");
    let judge = params.judge ?? sender.address;
    if (params.judge) {
      judge = await getUserInfo(params.judge);
    }
    console.log(
      "Creating toss...",
      params.options,
      params.amount,
      params.description,
      judge?.address ?? sender.address,
      params?.endTime ?? BigInt(0),
    );
    const tossId = await createToss(
      context,
      params.options,
      params.amount,
      params.description,
      judge?.address ?? sender.address,
      params?.endTime ?? undefined,
    );
    if (tossId !== undefined) {
      await db?.read();
      if (group && !db?.data?.firstToss[group.id]) {
        db.data.firstToss[group.id] = true;
        await context.send(GROUP_MESSAGE_FIRST);
        await db.write();
      }

      await context.send(`Here is your toss!`);
      await context.send(`${frameUrl}/frames/toss/${tossId}`);
    } else {
      await context.send(
        `An error occurred while creating the toss. ${JSON.stringify(tossId)}`,
      );
    }
  }
}

export const createToss = async (
  context: XMTPContext,
  options: string,
  amount: string,
  description: string,
  judge: string,
  endTime?: string | bigint,
) => {
  try {
    const amountString = `${amount}`;
    const uuid = uuidv4();
    const redis = await getRedisClient();

    redis.set(
      uuid,
      JSON.stringify({
        description: description,
        options: options,
        amount: amount,
        admin: judge,
      }),
    );

    const account = privateKeyToAccount(process.env.KEY! as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    const parsedAmount = BigInt(parseUnits(amountString, 6));

    if (endTime) {
      const date = new Date(endTime as string);
      const timestamp = Math.floor(date.getTime() / 1000);
      if (isNaN(timestamp)) {
        console.error("Invalid endTime provided:", endTime);
        // Fix: Correctly set a default endTime if the provided one is invalid
        endTime = BigInt(Math.floor(new Date().getTime() / 1000) + 34 * 60);
      } else {
        endTime = BigInt(timestamp);
      }
    } else {
      // Fix: Set a default endTime if none is provided
      endTime = BigInt(Math.floor(new Date().getTime() / 1000) + 34 * 60);
    }
    const createTossTx = await walletClient.writeContract({
      account: account,
      abi: COINTOSSBOT_ABI,
      address: process.env.COINTOSS_CONTRACT_ADDRESS! as `0x${string}`,
      functionName: "createToss",
      args: [
        judge as `0x${string}`,
        description as string,
        (options as string).split(","),
        [parsedAmount, parsedAmount],
        endTime,
        BigInt(0),
      ],
    });
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    await publicClient.waitForTransactionReceipt({
      hash: createTossTx,
    });
    const tossId = await publicClient.readContract({
      address: process.env.COINTOSS_CONTRACT_ADDRESS! as `0x${string}`,
      abi: COINTOSSBOT_ABI,
      functionName: "tossId",
    });

    return tossId;
  } catch (error) {
    console.error("Error creating toss:", error);
    await context.send(
      "An error occurred while creating the toss. Please try again later.",
    );
  }
};
