import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { FRAME_URL } from "../../bot/src/lib/constants.js";

export function getFrameUrl() {
  return FRAME_URL || "http://localhost:3000";
}
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cointoss",
    other: {
      ...(await fetchMetadata(new URL("/frames", FRAME_URL))),
    },
  };
}

export default async function Home() {
  return <div />;
}
