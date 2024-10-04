import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  if (req.headers.get("secret") !== process.env.SECRET) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }
  const body = await req.json();
  const { admin, betId } = body;

  const wallet = new Wallet(process.env.KEY as string);
  const xmtp = await Client.create(wallet, {
    env: "production",
  });

  if (admin && betId) {
    const conversation = await xmtp.conversations.newConversation(admin);
    await conversation.send(
      `Share this url with your friends on Coinbase Wallet:\n\n${process.env.FRAME_URL}/frames/toss/${betId}`,
    );
  }
  return NextResponse.json({ message: "Success" });
};
