import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { getFrameUrl } from "./utils";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cointoss Frame",
    description: "This is a frame to toss and send on Base",
    other: {
      ...(await fetchMetadata(new URL(getFrameUrl() + "/frame"))),
    },
  };
}

export default async function Home() {
  return (
    <div className="p-16 h-screen flex flex-col gap-16 text-white items-center justify-center bg-gradient-to-r from-10% from-[#25B618] via-[#184423] to-[#1C2721]">
      <div className="flex flex-col gap-2 text-center items-center justify-center mx-auto max-w-screen-md">
        <div className="text-3xl font-bold text-center">Cointoss</div>
      </div>
      <div className="flex flex-col gap-2 text-center items-center justify-center mx-auto max-w-screen-md">
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="text-3xl font-bold text-center">
            Fun with friends.
          </div>
        </div>
      </div>
    </div>
  );
}
