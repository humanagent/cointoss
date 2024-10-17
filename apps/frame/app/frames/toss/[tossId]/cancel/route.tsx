import { frames } from "../../../frames";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { BETBOT_ABI } from "@/app/abi";
import { vercelURL } from "@/app/utils";
import { Button } from "frames.js/next";
import { getRedisClient } from "@/lib/redis";

const handleRequest = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const tossId = url.pathname.split("/")[3];

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const [bet, outcomes, amounts] = await publicClient.readContract({
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETBOT_ABI,
    functionName: "betInfo",
    args: [BigInt(tossId)],
  });

  const amount = amounts[0];
  const user = await ctx.walletAddress();

  const redis = await getRedisClient();

  if (bet.admin.toLowerCase() !== user?.toLowerCase()) {
    // a user who is not admin can't set the result
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <div tw="flex flex-col w-[100%] h-[100%]">
            <img
              src={`${vercelURL()}/images/frame_base_message.png`}
              width={"100%"}
              height={"100%"}
              tw="relative">
              <div tw="absolute relative flex justify-center w-full px-[32px]">
                <h1
                  tw="text-[#014601] text-[100px] uppercase text-center"
                  style={{ fontFamily: "Vanguard-Bold" }}>
                  Access denied
                </h1>
              </div>
              <div tw="absolute flex justify-center w-full px-[64px] top-[540px]">
                <h1
                  tw="text-[#014601] text-[64px] text-center"
                  style={{ fontFamily: "Overpass" }}>
                  Only the person who created this toss can cancel it.
                </h1>
              </div>
            </img>
          </div>
        </div>
      ),
      imageOptions: {
        aspectRatio: "1:1",
      },
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=0",
      },
      buttons: [
        <Button action="post" target={`/toss/${tossId}`}>
          ⬅️ Go back
        </Button>,
      ],
    };
  }

  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <img
          src={`${vercelURL()}/images/frame_base_message.png`}
          width={"100%"}
          height={"100%"}
          tw="relative">
          <div tw="absolute relative flex justify-center w-full px-[32px]">
            <h1
              tw="text-[#014601] text-[100px] uppercase text-center"
              style={{ fontFamily: "Vanguard-Bold" }}>
              Cancel this toss?
            </h1>
          </div>
          <div tw="absolute flex justify-center w-full px-[64px] top-[540px]">
            <h1
              tw="text-[#014601] text-[64px] text-center"
              style={{ fontFamily: "Overpass" }}>
              If you cancel this toss, the funds will be distributed.
            </h1>
          </div>
        </img>
      </div>
    ),
    imageOptions: {
      aspectRatio: "1:1",
    },
    headers: {
      "Cache-Control": "public, immutable, no-transform, max-age=0",
    },
    buttons: [
      <Button
        action="tx"
        target={`/cancel-bet-tx?tossId=${tossId}`}
        post_url={`/cancel-bet-tx/success?tossId=${tossId}`}>
        ✅ Confirm
      </Button>,
      <Button action="post" target={`/toss/${tossId}/manage`}>
        ⬅️ Go back
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
