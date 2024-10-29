import { frames } from "../../../frames";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { COINTOSS_ABI } from "@/app/abi";
import { parseAddress, vercelURL } from "@/app/utils";
import { Button } from "frames.js/next";

const handleRequest = frames(async (ctx) => {
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

  const amount = amounts[0];
  const user = await ctx.walletAddress();

  const totalTossAmount = formatUnits(toss.totalTossingAmount, 6);

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

  if (toss.admin.toLowerCase() !== user?.toLowerCase()) {
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
                  Only the person who created this toss can change the settings.
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
          src={`${vercelURL()}/images/frame_base.png`}
          width={"100%"}
          height={"100%"}
          tw="relative">
          {" "}
          <div tw="absolute relative flex justify-center items-center w-full h-[350px] px-[36px]">
            <h1
              tw="text-[#014601] text-[120px] uppercase text-center"
              style={{ fontFamily: "Vanguard-Bold", lineHeight: "80px" }}>
              {toss.condition}
            </h1>
          </div>
          <div tw="absolute top-[560px] flex flex-row w-full justify-between px-[128px]">
            <div tw="flex justify-center w-[357px]">
              <h1 tw="text-black font-bold text-[48px]">{outcomes[0]}</h1>
            </div>

            <div tw="flex justify-center w-[357px]">
              <h1 tw="text-black font-bold text-[48px]">{outcomes[1]}</h1>
            </div>
          </div>
          <div tw="absolute bottom-[130px] px-[116px] flex flex-row w-full justify-between">
            <div tw="absolute relative flex justify-center w-[200px]">
              <h1
                tw="text-[#014601] font-bold text-[48px]"
                style={{ fontFamily: "Vanguard-Bold", fontWeight: 700 }}>
                ${formatUnits(amount, 6) || "0"}
              </h1>
            </div>
            <div tw="absolute relative flex justify-center w-[200px]">
              <h1
                tw="text-[#014601] font-bold text-[48px]"
                style={{ fontFamily: "Vanguard-Bold", fontWeight: 700 }}>
                ${totalTossAmount}
              </h1>
            </div>
            <div tw="absolute relative flex justify-center w-[200px]">
              <h1
                tw="text-[#014601] font-bold text-[48px]"
                style={{ fontFamily: "Vanguard-Bold", fontWeight: 700 }}>
                {totalPlayers || "0"}
              </h1>
            </div>
          </div>
          <div tw="absolute top-[508px] left-[190px] flex">
            <div tw="absolute top-[474px] relative flex justify-center w-[200px]">
              <h1
                tw="text-[26px] font-bold"
                style={{ fontFamily: "Overpass-Bold", fontWeight: 700 }}>
                {parseAddress(toss.admin)}
              </h1>
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
      // <Button
      //   action="tx"
      //   target={`/set-toss-result-tx?tossId=${tossId}&outcome=0`}
      //   post_url={`/toss/${tossId}`}
      // >
      //   {`🏆 ${outcomes[0]}`}
      // </Button>,
      // <Button
      //   action="tx"
      //   target={`/set-toss-result-tx?tossId=${tossId}&outcome=1`}
      //   post_url={`/toss/${tossId}`}
      // >
      //   {`🏆 ${outcomes[1]}`}
      // </Button>,
      <Button
        action="tx"
        target={`/set-toss-result-tx?tossId=${tossId}&outcome=0`}
        post_url={`/set-toss-result-tx/success?tossId=${tossId}&outcome=0`}>
        {`🏆 ${outcomes[0]}`}
      </Button>,
      <Button
        action="tx"
        target={`/set-toss-result-tx?tossId=${tossId}&outcome=1`}
        post_url={`/set-toss-result-tx/success?tossId=${tossId}&outcome=1`}>
        {`🏆 ${outcomes[1]}`}
      </Button>,
      <Button action="post" target={`/toss/${tossId}/cancel`}>
        ❌ Cancel
      </Button>,
      <Button action="post" target={`/toss/${tossId}`}>
        ⬅️ Go back
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
