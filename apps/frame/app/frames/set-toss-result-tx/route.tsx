import { Abi, encodeFunctionData } from "viem";
import { frames } from "../frames";
import { transaction } from "frames.js/core";
import { base } from "viem/chains";
import { COINTOSS_ABI } from "@/app/abi";

export const POST = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  const outcome = queryParams.get("outcome");
  const tossId = queryParams.get("tossId");

  if (!ctx?.message) {
    throw new Error("Invalid frame message");
  }

  if (!outcome || !tossId) {
    throw new Error("Invalid parameters");
  }

  const calldata = encodeFunctionData({
    abi: COINTOSS_ABI,
    functionName: "resolveToss",
    args: [BigInt(tossId), BigInt(outcome), true] as const,
  });

  return transaction({
    chainId: `eip155:${base.id}`,
    method: "eth_sendTransaction",
    params: {
      abi: COINTOSS_ABI as Abi,
      to: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      data: calldata,
      value: "0",
    },
    attribution: false,
  });
});
