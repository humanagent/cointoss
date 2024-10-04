import { Abi, encodeFunctionData, parseUnits } from "viem";
import { frames } from "../frames";
import { transaction } from "frames.js/core";
import { base } from "viem/chains";
import { ERC20_ABI } from "@/app/abi";

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
    abi: ERC20_ABI,
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
      abi: ERC20_ABI as Abi,
      to: process.env.USDC_CONTRACT_ADDRESS as `0x${string}`,
      data: calldata,
      value: "0",
    },
    attribution: false,
  });
});
