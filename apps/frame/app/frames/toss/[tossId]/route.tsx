import { frames } from "../../frames";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { COINTOSS_ABI } from "@/app/abi";
import {
  TossStatus,
  getImageAndENS,
  parseAddress,
  vercelURL,
} from "@/app/utils";
import { Button } from "frames.js/next";
import { getRedisClient } from "@/lib/redis";

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

  const amount = amounts[0];
  const redis = await getRedisClient();
  const tossDataString = await redis.get(tossId);
  const tossData = tossDataString ? JSON.parse(tossDataString) : null;

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

  const { avatarUrl, ens } = await getImageAndENS(toss.admin);
  console.log(avatarUrl, ens);

  const totalPlayers = outcomeOnePlayers.length + outcomeTwoPlayers.length;

  if (toss.status === TossStatus.PAUSED) {
    //@ts-ignore
    const txUrl = tossData?.cancelTransactionId
      ? `https://basescan.org/tx/${tossData?.cancelTransactionId}`
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
  if (toss.status === TossStatus.PAID || toss.status === TossStatus.RESOLVED) {
    const txUrl = `https://basescan.org/tx/${tossData.resultTransactionId}`;
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${vercelURL()}/images/frame_base_option_${Number(
              BigInt(toss.outcomeIndex),
            )}.png`}
            width={"100%"}
            height={"100%"}
            tw="relative">
            <div tw="absolute relative flex justify-center items-center w-full h-[350px] px-[36px]">
              <h1
                tw="text-[#014601] text-[120px] uppercase text-center"
                style={{ fontFamily: "Vanguard-Bold", lineHeight: "80px" }}>
                {toss.condition}
              </h1>
            </div>

            <div tw="absolute top-[400px] left-[64px] flex flex-col items-center justify-center h-[408px] w-[478px]">
              {toss.outcomeIndex === BigInt(0) ? (
                <p
                  tw="text-white text-[24px] uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Option 1
                </p>
              ) : (
                <p
                  tw="text-[#014601] text-[24px] uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Option 1
                </p>
              )}
              {toss.outcomeIndex === BigInt(0) ? (
                <p tw="text-white font-bold text-[40px] -mt-[16px]">
                  {outcomes[0]}
                </p>
              ) : (
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {outcomes[0]}
                </p>
              )}
            </div>

            <div tw="absolute top-[400px] right-[64px] flex flex-col items-center justify-center h-[408px] w-[478px]">
              {toss.outcomeIndex === BigInt(1) ? (
                <p
                  tw="text-white text-[24px] uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Option 2
                </p>
              ) : (
                <p
                  tw="text-[#014601] text-[24px] uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Option 2
                </p>
              )}
              {toss.outcomeIndex === BigInt(1) ? (
                <p tw="text-white font-bold text-[40px] -mt-[16px]">
                  {outcomes[1]}
                </p>
              ) : (
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {outcomes[1]}
                </p>
              )}
            </div>
            <div tw="absolute top-[848px] left-[64px] flex flex-row items-center justify-between h-[150px] w-[1018px]">
              <div tw="flex flex-col items-center justify-center h-[150px] w-[300px]">
                <p
                  tw="text-[#014601] text-[24px] uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Amount
                </p>
                <p tw="text-[#014601] font-bold text-[40px] -mt-[16px]">
                  ${formatUnits(amount, 6) || "0"}
                </p>
              </div>
              <div tw="flex flex-col items-center justify-center h-[150px] w-[300px]">
                <p
                  tw="text-[#014601] text-[24px] uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Total Pool
                </p>
                <p tw="text-[#014601] font-bold text-[40px] -mt-[16px]">
                  ${totalTossAmount}
                </p>
              </div>
              <div tw="flex flex-col items-center justify-center h-[150px] w-[300px]">
                <p
                  tw="text-[#014601] text-[24px] font-bold uppercase"
                  style={{ lineHeight: 0.1 }}>
                  Entrants
                </p>
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {totalPlayers || "0"}
                </p>
              </div>
            </div>
            <div tw="absolute bottom-[64px] left-[64px] h-[90px] w-full flex flex-row items-center space-x-8">
              {avatarUrl ? (
                <img src={avatarUrl} tw="h-[72px] w-[72px] rounded-full" />
              ) : (
                <div tw="h-[72px] w-[72px] rounded-full bg-gray-200 flex" />
              )}
              <div tw="flex flex-col items-start ml-2">
                <p tw="text-[26px]">
                  Created by{" "}
                  <span
                    tw="font-bold ml-2"
                    style={{
                      fontFamily: "Overpass-Bold",
                      fontWeight: 700,
                    }}>
                    {ens ? ens : parseAddress(toss.admin)}
                  </span>
                </p>
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

  if (toss.status === TossStatus.CREATED) {
    buttons.push(
      <Button action="post" target={`/toss/${tossId}/place-toss`}>
        🪙 Toss
      </Button>,
      <Button action="post" target={`/toss/${tossId}/manage`}>
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
          <div tw="absolute relative flex justify-center items-center w-full h-[350px] px-[36px]">
            <h1
              tw="text-[#014601] text-[120px] uppercase text-center"
              style={{ fontFamily: "Vanguard-Bold", lineHeight: "80px" }}>
              {toss.condition}
            </h1>
          </div>

          <div tw="absolute top-[400px] left-[64px] flex flex-col items-center justify-center h-[408px] w-[478px]">
            <p
              tw="text-[#014601] text-[24px] uppercase"
              style={{ lineHeight: 0.1 }}>
              Option 1
            </p>
            <p tw="text-black font-bold text-[40px] -mt-[16px]">
              {outcomes[0]}
            </p>
          </div>

          <div tw="absolute top-[400px] right-[64px] flex flex-col items-center justify-center h-[408px] w-[478px]">
            <p
              tw="text-[#014601] text-[24px] uppercase"
              style={{ lineHeight: 0.1 }}>
              Option 2
            </p>
            <p tw="text-black font-bold text-[40px] -mt-[16px]">
              {outcomes[1]}
            </p>
          </div>
          <div tw="absolute top-[848px] left-[64px] flex flex-row items-center justify-between h-[150px] w-[1018px]">
            <div tw="flex flex-col items-center justify-center h-[150px] w-[300px]">
              <p
                tw="text-[#014601] text-[24px] uppercase"
                style={{ lineHeight: 0.1 }}>
                Amount
              </p>
              <p tw="text-[#014601] font-bold text-[40px] -mt-[16px]">
                ${formatUnits(amount, 6) || "0"}
              </p>
            </div>
            <div tw="flex flex-col items-center justify-center h-[150px] w-[300px]">
              <p
                tw="text-[#014601] text-[24px] uppercase"
                style={{ lineHeight: 0.1 }}>
                Total Pool
              </p>
              <p tw="text-[#014601] font-bold text-[40px] -mt-[16px]">
                ${totalTossAmount}
              </p>
            </div>
            <div tw="flex flex-col items-center justify-center h-[150px] w-[300px]">
              <p
                tw="text-[#014601] text-[24px] font-bold uppercase"
                style={{ lineHeight: 0.1 }}>
                Entrants
              </p>
              <p tw="text-black font-bold text-[40px] -mt-[16px]">
                {totalPlayers || "0"}
              </p>
            </div>
          </div>
          <div tw="absolute bottom-[64px] left-[64px] h-[90px] w-full flex flex-row items-center space-x-8">
            {avatarUrl ? (
              <img src={avatarUrl} tw="h-[72px] w-[72px] rounded-full" />
            ) : (
              <div tw="h-[72px] w-[72px] rounded-full bg-gray-200 flex" />
            )}
            <div tw="flex flex-col items-start ml-2">
              <p tw="text-[26px]">
                Created by{" "}
                <span
                  tw="font-bold ml-2"
                  style={{
                    fontFamily: "Overpass-Bold",
                    fontWeight: 700,
                  }}>
                  {ens ? ens : parseAddress(toss.admin)}
                </span>
              </p>
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
