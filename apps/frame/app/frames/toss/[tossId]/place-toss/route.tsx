import { frames } from "../../../frames";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { base } from "viem/chains";

import { COINTOSS_ABI } from "@/app/abi";
import { TossStatus, getProfileInfo, getFrameUrl } from "@/app/utils";
import { Button } from "frames.js/next";
import { getRedisClient } from "@/lib/redis";

const handleRequest = frames(async (ctx) => {
  const user = await ctx.walletAddress();
  // get path params
  const url = new URL(ctx.request.url);
  const outcome = url.searchParams.get("outcome");

  if (!outcome) {
    throw new Error("Outcome is required");
  }

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

  let outcomesFormatted = outcomes.map(
    (outcome) =>
      outcome.charAt(0).toUpperCase() + outcome.slice(1).toLowerCase(),
  );

  const allowance = await publicClient.readContract({
    address: process.env.USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [
      user as `0x${string}`,
      process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    ],
  });

  const playerToss = await publicClient.readContract({
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    abi: COINTOSS_ABI,
    functionName: "playerToss",
    args: [user as `0x${string}`, BigInt(tossId)],
  });

  const playerHasTossed = await publicClient.readContract({
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    abi: COINTOSS_ABI,
    functionName: "playerHasTossed",
    args: [user as `0x${string}`, BigInt(tossId)],
  });

  const amount = amounts[0];

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

  const permitId = `permit-${tossId}-${user}`;
  let hasHash = false;
  if (ctx.message?.transactionId) {
    const permitHash = ctx.message.transactionId;
    console.log(permitHash, "permitHash", permitId);

    const redisClient = await getRedisClient();
    await redisClient.set(permitId, permitHash);

    hasHash = true;
  }

  const userProfile = await getProfileInfo(toss.admin);

  const buttons = [];
  if (toss.status === TossStatus.CREATED && !playerHasTossed) {
    if (!hasHash && (!allowance || BigInt(allowance) < BigInt(amounts[0]))) {
      buttons.push(
        <Button
          action="tx"
          target={`/place-toss-tx?amount=${formatUnits(BigInt(amount), 6)}`}
          post_url={`/toss/${tossId}/place-toss?outcome=${outcome}`}>
          {`Permit ${formatUnits(BigInt(amount), 6)} USDC`}
        </Button>,
      );
    } else if (hasHash) {
      buttons.push(
        <Button
          action="tx"
          target={`/place-toss-tx?tossId=${tossId}&outcome=${outcome}&permitId=${permitId}`}
          post_url={`/place-toss-tx/success?tossId=${tossId}&outcome=${outcome}&permitId=${permitId}`}>
          {outcome === "0"
            ? `Toss ${outcomesFormatted[0]}`
            : `Toss ${outcomesFormatted[0]}`}
        </Button>,
      );
    }
  }

  // check if user is admin and add manage button
  if (user === toss.admin) {
    buttons.push(
      <Button action="post" target={`/toss/${tossId}/manage`}>
        ⚙️ Manage
      </Button>,
    );
  }

  buttons.push(
    <Button action="post" target={`/toss/${tossId}`}>
      ⬅️ Go back
    </Button>,
  );

  if (toss.status === TossStatus.PAID || toss.status === TossStatus.RESOLVED) {
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${getFrameUrl()}/images/frame_base_option_${Number(
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
                  {outcomesFormatted[0]}
                </p>
              ) : (
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {outcomesFormatted[0]}
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
                  {outcomesFormatted[1]}
                </p>
              ) : (
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {outcomesFormatted[1]}
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
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  tw="h-[72px] w-[72px] rounded-full"
                />
              ) : (
                <div tw="h-[72px] w-[72px] rounded-full bg-gray-200 flex" />
              )}
              <div tw="flex flex-col items-start ml-2">
                <p tw="text-[26px] flex flex-col">
                  <span
                    tw="font-bold ml-2"
                    style={{
                      fontFamily: "Overpass-Bold",
                      fontWeight: 700,
                    }}>
                    Created by {userProfile?.preferredName}
                  </span>
                  <span
                    tw="font-bold ml-2"
                    style={{
                      fontFamily: "Overpass-Regular",
                      fontWeight: 400,
                    }}>
                    This bet ends in 24 hours
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
        <Button action="post" target={`/toss/${tossId}`}>
          ⬅️ Go back
        </Button>,
      ],
    };
  }
  if (playerHasTossed) {
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${getFrameUrl()}/images/frame_base_toss_${Number(
              playerToss,
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
                  {outcomesFormatted[0]}
                </p>
              ) : (
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {outcomesFormatted[0]}
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
                  {outcomesFormatted[1]}
                </p>
              ) : (
                <p tw="text-black font-bold text-[40px] -mt-[16px]">
                  {outcomesFormatted[1]}
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
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  tw="h-[72px] w-[72px] rounded-full"
                />
              ) : (
                <div tw="h-[72px] w-[72px] rounded-full bg-gray-200 flex" />
              )}
              <div tw="flex flex-col items-start ml-2">
                <p tw="text-[26px] flex flex-col">
                  <span
                    tw="font-bold ml-2"
                    style={{
                      fontFamily: "Overpass-Bold",
                      fontWeight: 700,
                    }}>
                    Created by {userProfile?.preferredName}
                  </span>
                  <span
                    tw="font-bold ml-2"
                    style={{
                      fontFamily: "Overpass-Regular",
                      fontWeight: 400,
                    }}>
                    This bet ends in 24 hours
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
  }

  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <img
          src={`${getFrameUrl()}/images/frame_base.png`}
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
              {outcomesFormatted[0]}
            </p>
          </div>

          <div tw="absolute top-[400px] right-[64px] flex flex-col items-center justify-center h-[408px] w-[478px]">
            <p
              tw="text-[#014601] text-[24px] uppercase"
              style={{ lineHeight: 0.1 }}>
              Option 2
            </p>
            <p tw="text-black font-bold text-[40px] -mt-[16px]">
              {outcomesFormatted[1]}
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
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                tw="h-[72px] w-[72px] rounded-full"
              />
            ) : (
              <div tw="h-[72px] w-[72px] rounded-full bg-gray-200 flex" />
            )}
            <div tw="flex flex-col items-start ml-2">
              <p tw="text-[26px] flex flex-col">
                <span
                  tw="font-bold ml-2"
                  style={{
                    fontFamily: "Overpass-Bold",
                    fontWeight: 700,
                  }}>
                  Created by {userProfile?.preferredName}
                </span>
                <span
                  tw="font-bold ml-2"
                  style={{
                    fontFamily: "Overpass-Regular",
                    fontWeight: 400,
                  }}>
                  This bet ends in 24 hours
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
