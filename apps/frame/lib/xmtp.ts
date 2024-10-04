import { BETBOT_ABI } from "@/app/abi";
import { createPublicClient, decodeEventLog, http } from "viem";
import { base } from "viem/chains";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const sendBetURLToAdmin = async (transactionHash: string) => {
  const transaction = await publicClient.getTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  const log = transaction.logs.find(
    (l) =>
      l.topics[0] ===
      "0x747bfd65be29bd8ccefc404a2050f744b50ebb3258d73baab72742eadf4db7c0",
  );
  if (!log) {
    return;
  }
  const decodedLog = decodeEventLog({
    abi: BETBOT_ABI,
    data: log.data,
    topics: log.topics,
    eventName: "BetCreated",
  });

  const { betId, admin } = decodedLog.args;
  const res = await fetch(`${process.env.FRAME_URL}/api/send-dm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      secret: process.env.SECRET!,
    },
    body: JSON.stringify({
      admin,
      betId: Number(betId),
    }),
  });
  if (!res.ok) {
    console.error("Failed sending XMTP DM", await res.text());
  }
};
