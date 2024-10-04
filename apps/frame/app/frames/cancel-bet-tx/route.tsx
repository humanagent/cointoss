import { Abi, encodeFunctionData } from "viem";
import { frames } from "../frames";
import { transaction } from "frames.js/core";
import { base } from "viem/chains";
import { BETBOT_ABI } from "@/app/abi";

export const POST = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  const betId = queryParams.get("betId");

  if (!ctx?.message) {
    throw new Error("Invalid frame message");
  }

  if (!betId) {
    throw new Error("Invalid parameters");
  }

  const calldata = encodeFunctionData({
    abi: BETBOT_ABI,
    functionName: "adminWithdrawPausedBet",
    args: [BigInt(betId)] as const,
  });

  return transaction({
    chainId: `eip155:${base.id}`,
    method: "eth_sendTransaction",
    params: {
      abi: BETBOT_ABI as Abi,
      to: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      data: calldata,
      value: "0",
    },
    attribution: false,
  });
});
