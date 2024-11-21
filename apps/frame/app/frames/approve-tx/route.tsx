import { Abi, encodeFunctionData, parseUnits } from "viem";
import { frames } from "../frames";
import { transaction } from "frames.js/core";
import { base } from "viem/chains";

import { COINTOSS_ABI } from "@/app/abi";

export const POST = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  const amount = queryParams.get("amount");

  if (!ctx?.message) {
    throw new Error("Invalid frame message");
  }

  if (!amount) {
    throw new Error("Invalid parameters");
  }

  const parsedAmount = BigInt(parseUnits(amount as string, 6));

  const calldata = encodeFunctionData({
    abi: COINTOSS_ABI as Abi,
    functionName: "approve",
    args: [
      process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      parsedAmount,
    ] as const,
  });

  return transaction({
    chainId: `eip155:${base.id}`,
    method: "eth_sendTransaction",
    params: {
      abi: COINTOSS_ABI as Abi,
      to: process.env.USDC_CONTRACT_ADDRESS as `0x${string}`,
      data: calldata,
      value: "0",
    },
    attribution: false,
  });
});
