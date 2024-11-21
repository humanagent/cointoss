import {
  Abi,
  createPublicClient,
  encodeFunctionData,
  http,
  parseUnits,
} from "viem";
import { frames } from "../frames";
import { transaction } from "frames.js/core";
import { base } from "viem/chains";
import { COINTOSS_ABI, ERC20_PERMIT_ABI } from "@/app/abi";
import { getRedisClient } from "@/lib/redis";
import { ethers } from "ethers";

export const POST = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  const outcome = queryParams.get("outcome");
  const tossId = queryParams.get("tossId");
  const permitId = queryParams.get("permitId");

  if (!ctx?.message) {
    throw new Error("Invalid frame message");
  }

  const userAddress = await ctx.walletAddress();

  if (!permitId) {
    const amount = queryParams.get("amount");

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const nonce = await publicClient.readContract({
      abi: ERC20_PERMIT_ABI,
      address: process.env.USDC_CONTRACT_ADDRESS! as `0x${string}`,
      functionName: "nonces",
      args: [userAddress! as `0x${string}`],
    });

    const message = {
      owner: userAddress!,
      spender: process.env.COINTOSS_CONTRACT_ADDRESS!,
      value: Number(parseUnits(amount!, 6)),
      nonce: Number(nonce),
      deadline: 99999999999,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: base.id,
      verifyingContract: process.env.USDC_CONTRACT_ADDRESS! as `0x${string}`,
    };

    return transaction({
      chainId: `eip155:${base.id}`,
      method: "eth_signTypedData_v4",
      params: {
        types,
        domain,
        primaryType: "Permit",
        message,
      },
    });
  }

  if (!outcome || !tossId || !permitId) {
    throw new Error("Invalid parameters");
  }

  const redisClient = await getRedisClient();
  const permitHash = await redisClient.get(permitId);

  if (!permitHash) {
    throw new Error("Invalid permit");
  }

  const { r, s, v } = ethers.utils.splitSignature(permitHash as `0x${string}`);
  const deadline = 99999999999;

  const calldata = encodeFunctionData({
    abi: COINTOSS_ABI,
    functionName: "placeTossWithPermit",
    args: [
      BigInt(tossId),
      BigInt(outcome),
      v,
      r as `0x${string}`,
      s as `0x${string}`,
      BigInt(deadline),
    ] as const,
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
