import { v4 as uuidv4 } from "uuid";
import { HandlerContext } from "@xmtp/message-kit";
import { privateKeyToAccount } from "viem/accounts";
import {
  GROUP_MESSAGE_FIRST,
  TOSS_LIST_REPLY,
  NO_PENDING_BETS_ERROR,
} from "../lib/constants.js";
import { base } from "viem/chains";
import { getRedisClient } from "../lib/redis.js";
import { db } from "../lib/db.js";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { COINTOSSBOT_ABI } from "../abi/index.js";

export async function handleTossCreation(context: HandlerContext) {
  const {
    message: {
      content: { content, params },
      sender,
      typeId,
    },
    group,
  } = context;

  if (params.description && params.options && params.amount) {
    await createToss(
      context,
      params.options,
      params.amount,
      params.description,
      params.judge ?? sender.address,
      group ? group.id : sender.address,
    );
  }
}

export const createToss = async (
  context: HandlerContext,
  options: string,
  amount: string,
  description: string,
  judge: string,
  groupid: string,
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

    const createBetTx = await walletClient.writeContract({
      account: account,
      abi: COINTOSSBOT_ABI,
      address: process.env.COINTOSS_CONTRACT_ADDRESS! as `0x${string}`,
      functionName: "createBet",
      args: [
        judge as `0x${string}`,
        description as string,
        (options as string).split(","),
        [parsedAmount, parsedAmount],
        BigInt(0),
      ],
    });
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    await publicClient.waitForTransactionReceipt({
      hash: createBetTx,
    });
    const tossId = await publicClient.readContract({
      address: process.env.COINTOSS_CONTRACT_ADDRESS! as `0x${string}`,
      abi: COINTOSSBOT_ABI,
      functionName: "betId",
    });

    await db?.read();
    if (!db?.data?.firstToss[groupid]) {
      db.data.firstToss[groupid] = true;
      await context.send(GROUP_MESSAGE_FIRST);
      await db.write();
    } else await context.send("Here is your toss!");
    await context.send(`${process.env.FRAME_URL}/frames/toss/${tossId}`);
  } catch (error) {
    console.error("Error creating toss:", error);
    await context.send(
      "An error occurred while creating the toss. Please try again later.",
    );
  }
};

export const handleBetList = async (context: HandlerContext) => {
  const {
    message: { sender },
  } = context;

  await context.send(TOSS_LIST_REPLY);

  const publicClient = createPublicClient({ chain: base, transport: http() });
  const betPlacedEvents = await publicClient.getContractEvents({
    abi: COINTOSSBOT_ABI,
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    eventName: "BetPlaced",
    args: { bettor: sender.address as `0x${string}` },
  });
  const betsFrames = await Promise.all(
    betPlacedEvents.map(async (event) => {
      const bet = await publicClient.readContract({
        abi: COINTOSSBOT_ABI,
        address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "bets",
        args: [event.args.betId!],
      });
      return bet[4] === 0
        ? `${process.env.FRAME_URL}/frames/toss/${event.args.betId!}`
        : null;
    }),
  );

  const pendingBets = betsFrames.filter(Boolean);
  if (pendingBets.length === 0) {
    await context.send(NO_PENDING_BETS_ERROR);
  } else {
    await Promise.all(
      pendingBets.map(async (frame) => await context.send(frame!)),
    );
  }
};
