import { frames } from "../../frames";
import { getFrameUrl } from "@/app/utils";
import { getRedisClient } from "@/lib/redis";
import { Button } from "frames.js/next";

const handleRequest = frames(async (ctx) => {
  // get path params
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  const tossId = queryParams.get("tossId");

  const buttons = [
    <Button action="post" target={`/toss/${tossId}`}>
      ⬅️ Go back
    </Button>,
  ];

  // save cancel toss tx hash
  const txHash = ctx.message?.transactionId;
  if (txHash && tossId) {
    // save tx hash
    const redis = await getRedisClient();
    const tossDataString = await redis.get(tossId);
    const tossData = tossDataString ? JSON.parse(tossDataString) : null;
    await redis.set(tossId, {
      //@ts-ignore
      ...tossData,
      cancelTransactionId: txHash,
    });
  }

  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${getFrameUrl()}/images/frame_base_message.png`}
            width={"100%"}
            height={"100%"}
            tw="relative">
            <div tw="absolute relative flex justify-center w-full px-[32px]">
              <h1
                tw="text-[#014601] text-[100px] uppercase text-center"
                style={{ fontFamily: "Vanguard-Bold" }}>
                Toss cancelled!
              </h1>
            </div>
            <div tw="absolute flex justify-center w-full px-[64px] top-[540px]">
              <h1
                tw="text-[#014601] text-[64px] text-center"
                style={{ fontFamily: "Overpass" }}>
                You've successfully cancelled this toss.
              </h1>
            </div>
            <div tw="absolute flex justify-center w-full px-[64px] top-[750px]">
              <h1
                tw="text-[#014601] text-[64px] text-center"
                style={{ fontFamily: "Overpass" }}>
                Funds have been distributed.
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
    buttons,
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
