import { frames } from "../../frames";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { BETBOT_ABI } from "@/app/abi";
import { BetStatus, parseAddress, vercelURL } from "@/app/utils";
import { Button } from "frames.js/next";
import { getRedisClient } from "@/lib/redis";

const handleRequest = frames(async (ctx) => {
  // get path params
  const url = new URL(ctx.request.url);
  const betId = url.pathname.split("/")[3];
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const [bet, outcomes, amounts] = await publicClient.readContract({
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETBOT_ABI,
    functionName: "betInfo",
    args: [BigInt(betId)],
  });

  const amount = amounts[0];
  const redis = await getRedisClient();
  const betDataString = await redis.get(betId);
  const betData = betDataString ? JSON.parse(betDataString) : null;

  const totalBetAmount = formatUnits(bet.totalBettingAmount, 6);

  const [outcomeOnePlayers, outcomeTwoPlayers] = await Promise.all([
    publicClient.readContract({
      address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      abi: BETBOT_ABI,
      functionName: "outcomeForPlayer",
      args: [BigInt(betId), BigInt(0)],
    }),
    publicClient.readContract({
      address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
      abi: BETBOT_ABI,
      functionName: "outcomeForPlayer",
      args: [BigInt(betId), BigInt(1)],
    }),
  ]);

  const totalPlayers = outcomeOnePlayers.length + outcomeTwoPlayers.length;

  if (bet.status === BetStatus.PAUSED) {
    //@ts-ignore
    const txUrl = betData?.cancelTransactionId
      ? `https://basescan.org/tx/${betData?.cancelTransactionId}`
      : null;
    const pausedButtons = [];
    if (txUrl) {
      pausedButtons.push(
        <Button action="link" target={txUrl}>
          View Transaction
        </Button>,
      );
    }
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
                  Toss Cancelled
                </h1>
              </div>
              <div tw="absolute flex justify-center w-full px-[64px] top-[540px]">
                <h1
                  tw="text-[#014601] text-[64px] text-center"
                  style={{ fontFamily: "Overpass" }}>
                  This toss was cancelled by the creator
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
      buttons: pausedButtons,
    };
  }
  if (bet.status === BetStatus.PAID || bet.status === BetStatus.RESOLVED) {
    const txUrl = `https://basescan.org/tx/${betData.resultTransactionId}`;
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${vercelURL()}/images/frame_base_option_${Number(
              BigInt(bet.outcomeIndex),
            )}.png`}
            width={"100%"}
            height={"100%"}
            tw="relative">
            <div tw="absolute relative flex justify-center w-full px-[32px]">
              <h1
                tw="text-[#014601] text-[100px] uppercase text-center"
                style={{ fontFamily: "Vanguard-Bold" }}>
                {bet.condition}
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
                  ${totalBetAmount}
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
                  {parseAddress(bet.admin)}
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
        <Button action="link" target={txUrl}>
          View Transaction
        </Button>,
      ],
    };
  }

  const buttons = [];

  if (bet.status === BetStatus.CREATED) {
    buttons.push(
      <Button action="post" target={`/toss/${betId}/place-bet`}>
        🪙 Toss
      </Button>,
      <Button action="post" target={`/toss/${betId}/manage`}>
        ⚙️ Manage
      </Button>,
    );
  }

  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <img
          src={`${vercelURL()}/images/frame_base.png`}
          width={"100%"}
          height={"100%"}
          tw="relative">
          <div tw="absolute relative flex justify-center w-full px-[32px]">
            <h1
              tw="text-[#014601] text-[120px] uppercase text-center"
              style={{ fontFamily: "Vanguard-Bold", lineHeight: "80px" }}>
              {bet.condition}
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
                ${totalBetAmount}
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
                {parseAddress(bet.admin)}
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
    buttons,
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
