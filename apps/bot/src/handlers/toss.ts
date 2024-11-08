import { v4 as uuidv4 } from "uuid";
import { HandlerContext } from "@xmtp/message-kit";
import { privateKeyToAccount } from "viem/accounts";
import { GROUP_MESSAGE_FIRST } from "../lib/constants.js";
import { base } from "viem/chains";
import { getRedisClient } from "../lib/redis.js";
import { db } from "../lib/db.js";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { COINTOSSBOT_ABI } from "../abi/index.js";
import type { SkillResponse } from "@xmtp/message-kit";

export function getFrameUrl() {
  return process.env.FRAME_URL || "http://localhost:3000";
}
export async function handleTossCreation(
  context: HandlerContext,
): Promise<SkillResponse> {
  const {
    message: {
      content: { params },
      sender,
    },
    group,
  } = context;

  console.log("Creating toss", params);
  if (params.description && params.options && !isNaN(Number(params.amount))) {
    console.log("Creating toss", params);

    const response = await createToss(
      context,
      params.options,
      params.amount,
      params.description,
      params.judge ?? sender.address,
      group ? group.id : sender.address,
      params.endTime,
    );
    console.log("Toss created", response);
    return {
      message: "success",
      code: 300,
    };
  }
  return {
    message: "Invalid parameters",
    code: 400,
  };
}

export const createToss = async (
  context: HandlerContext,
  options: string,
  amount: string,
  description: string,
  judge: string,
  groupid: string,
  endTime: string,
) => {
  //context.reply("one sec...");
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

    const date = new Date(endTime); // Example date
    const timestamp = Math.floor(date.getTime() / 1000); // Convert to Unix timestamp
    if (isNaN(timestamp)) {
      console.error("Invalid endTime provided:", endTime);
      return {
        message: "Invalid endTime",
        code: 400,
      };
    }

    console.log("Creating toss", parsedAmount);
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
        BigInt(timestamp), // Ensure it's a BigNumber for uint256
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

    await db?.read();
    if (!db?.data?.firstToss[groupid]) {
      db.data.firstToss[groupid] = true;
      await context.send(GROUP_MESSAGE_FIRST);
      await db.write();
    } else await context.send("Here is your toss!");
    await context.send(`${getFrameUrl()}/frames/toss/${tossId}`);
  } catch (error) {
    console.error("Error creating toss:", error);
    await context.send(
      "An error occurred while creating the toss. Please try again later.",
    );
  }
};
