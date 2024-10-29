import { frames } from "../../../frames";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { COINTOSS_ABI } from "@/app/abi";
import { TossStatus, parseAddress, vercelURL } from "@/app/utils";
import { Button } from "frames.js/next";
import { getRedisClient } from "@/lib/redis";

const handleRequest = frames(async (ctx) => {
  const user = await ctx.walletAddress();
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

  const buttons = [];
  if (toss.status === TossStatus.CREATED && !playerHasTossed) {
    if (!hasHash && (!allowance || BigInt(allowance) < BigInt(amounts[0]))) {
      buttons.push(
        <Button
          action="tx"
          target={`/place-toss-tx?amount=${formatUnits(BigInt(amount), 6)}`}
          post_url={`/toss/${tossId}/place-toss`}>
          {`Permit ${formatUnits(BigInt(amount), 6)} USDC`}
        </Button>,
      );
      // buttons.push(
      //   <Button action="post" target={`/toss/${tossId}/place-toss`}>
      //     🔄 Refresh permit
      //   </Button>,
      // );
    } else if (hasHash) {
      buttons.push(
        <Button
          action="tx"
          target={`/place-toss-tx?tossId=${tossId}&outcome=0&permitId=${permitId}`}
          post_url={`/place-toss-tx/success?tossId=${tossId}&outcome=0&permitId=${permitId}`}>
          {`🔵 ${outcomes[0]}`}
        </Button>,
      );
      buttons.push(
        <Button
          action="tx"
          target={`/place-toss-tx?tossId=${tossId}&outcome=1`}
          post_url={`/place-toss-tx/success?tossId=${tossId}&outcome=1`}>
          {`🔴 ${outcomes[1]}`}
        </Button>,
      );
    }
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
            src={`${vercelURL()}/images/frame_base_option_${Number(
              BigInt(toss.outcomeIndex),
            )}.png`}
            width={"100%"}
            height={"100%"}
            tw="relative">
            <div tw="absolute top-[40px] relative flex">
              <div tw="absolute top-0 left-[40px] flex">
                <div tw="absolute top-[54px] left-[600px] flex">
                  <div tw="absolute top-[40px] flex">
                    <div tw="absolute left-[4px] text-[28px]">
                      {parseAddress(toss.admin)}
                    </div>
                  </div>
                  <div tw="absolute top-[32px] left-[174px] flex">
                    <div tw="absolute left-[48px] text-[40px] flex">
                      <span tw="mr-2" style={{ fontFamily: "Overpass-Bold" }}>
                        {formatUnits(amount, 6) || "0"}
                      </span>{" "}
                      USDC
                    </div>
                  </div>
                </div>
              </div>
              <div tw="absolute top-[225px] flex">
                <div tw="absolute flex">
                  <div
                    tw="absolute top-[71px] px-[40px] flex text-[64px] h-[231px] max-w-[920px]"
                    style={{
                      fontFamily: "Overpass-Italic",
                      fontStyle: "italic",
                    }}>
                    {toss.condition}
                  </div>
                </div>
                <div tw="absolute top-[560px] flex flex-row w-full justify-between px-[128px]">
                  {toss.outcomeIndex === BigInt(0) ? (
                    <div tw="mx-auto w-[500px] flex items-center justify-center text-center text-[56px]">
                      {outcomes[0]}
                    </div>
                  ) : (
                    <div tw="mx-auto w-[500px] flex items-center justify-center text-center text-[56px] opacity-30">
                      {outcomes[0]}
                    </div>
                  )}
                  {toss.outcomeIndex === BigInt(1) ? (
                    <div tw="mx-auto w-[500px] flex items-center justify-center text-center text-[56px]">
                      {outcomes[1]}
                    </div>
                  ) : (
                    <div tw="mx-auto w-[500px] flex items-center justify-center text-center text-[56px] opacity-30">
                      {outcomes[1]}
                    </div>
                  )}
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
  if (playerHasTossed) {
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${vercelURL()}/images/frame_base_bet_${Number(
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
            <div tw="absolute top-[560px] flex flex-row w-full justify-between px-[128px]">
              <div tw="flex justify-center w-[357px]">
                {playerToss === BigInt(0) ? (
                  <h1 tw={"text-white font-bold text-[48px]"}>{outcomes[0]}</h1>
                ) : (
                  <h1 tw={"text-black font-bold text-[48px]"}>{outcomes[0]}</h1>
                )}
              </div>
              <div tw="flex justify-center w-[357px]">
                {playerToss === BigInt(1) ? (
                  <h1 tw={"text-white font-bold text-[48px]"}>{outcomes[1]}</h1>
                ) : (
                  <h1 tw={"text-black font-bold text-[48px]"}>{outcomes[1]}</h1>
                )}
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
      buttons,
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
          <div tw="absolute relative flex justify-center items-center w-full h-[350px] px-[36px]">
            <h1
              tw="text-[#014601] text-[120px] uppercase text-center"
              style={{ fontFamily: "Vanguard-Bold", lineHeight: "80px" }}>
              {toss.condition}
            </h1>
          </div>
          <div tw="absolute top-[560px] flex flex-row w-full justify-between px-[128px]">
            <div tw="absolute relative flex justify-center w-[357px]">
              <h1 tw="text-black font-bold text-[48px]">{outcomes[0]}</h1>
            </div>
            <div tw="absolute relative flex justify-center w-[357px]">
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
    buttons,
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
