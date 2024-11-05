import { frames } from "../../../frames";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { COINTOSS_ABI } from "@/app/abi";
import { TossStatus, getFrameUrl } from "@/app/utils";
import { Button } from "frames.js/next";

const handleRequest = frames(async (ctx) => {
  // get path params
  const url = new URL(ctx.request.url);
  const tossId = url.pathname.split("/")[3];

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const [toss, outcomes, amounts] = await publicClient.readContract({
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    abi: COINTOSS_ABI,
    functionName: "tossInfo",
    args: [BigInt(tossId)],
  });

  const [outcomeOnePlayers, outcomeTwoPlayers] = await Promise.all([
    publicClient.readContract({
      address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      abi: COINTOSS_ABI,
      functionName: "outcomeForPlayer",
      args: [BigInt(tossId), BigInt(0)],
    }),
    publicClient.readContract({
      address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      abi: COINTOSS_ABI,
      functionName: "outcomeForPlayer",
      args: [BigInt(tossId), BigInt(1)],
    }),
  ]);

  const totalPlayers = outcomeOnePlayers.length + outcomeTwoPlayers.length;
  const totalTossAmount = formatUnits(toss.totalTossingAmount, 6);

  if (toss.status === TossStatus.PAID || toss.status === TossStatus.RESOLVED) {
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${getFrameUrl()}/images/frame_bet_status_closed.png`}
            width={"100%"}
            height={"100%"}
            tw="relative">
            <div tw="absolute flex top-[225px] left-[40px] w-[100%] h-[100%]">
              <div tw="absolute flex top-[16px] left-[40px]">
                <div tw="absolute flex top-[92px] left-[8px] w-[424px]">
                  <div tw="flex flex-row text-[#15672A] mx-auto top-[218px] text-[60px] text-center">
                    <h1
                      style={{
                        fontFamily: "Overpass-Italic",
                        fontStyle: "italic",
                      }}>
                      {totalTossAmount}$
                    </h1>
                  </div>
                </div>
              </div>
              <div tw="absolute flex top-[16px] left-[584px]">
                <div tw="absolute flex top-[92px] left-[8px] w-[424px]">
                  <div tw="flex flex-row text-[#15672A] mx-auto top-[218px] text-[60px] text-center">
                    <h1
                      style={{
                        fontFamily: "Overpass-Italic",
                        fontStyle: "italic",
                      }}>
                      {totalPlayers || "0"}
                    </h1>
                  </div>
                </div>
              </div>
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
          src={`${getFrameUrl()}/images/frame_bet_status.png`}
          width={"100%"}
          height={"100%"}
          tw="relative">
          <div tw="absolute flex top-[225px] left-[40px] w-[100%] h-[100%]">
            <div tw="absolute flex top-[16px] left-[40px]">
              <div tw="absolute flex top-[92px] left-[8px] w-[424px]">
                <div tw="flex flex-row mx-auto top-[218px] text-[60px] text-center">
                  <h1
                    style={{
                      fontFamily: "Overpass-Bold",
                    }}>
                    {totalTossAmount}$
                  </h1>
                </div>
              </div>
            </div>
            <div tw="absolute flex top-[16px] left-[584px]">
              <div tw="absolute flex top-[92px] left-[8px] w-[424px]">
                <div tw="flex flex-row mx-auto top-[218px] text-[60px] text-center">
                  <h1
                    style={{
                      fontFamily: "Overpass-Bold",
                    }}>
                    {totalPlayers || "0"}
                  </h1>
                </div>
              </div>
            </div>
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
      <Button action="post" target={`/toss/${tossId}`}>
        ⬅️ Go back
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
