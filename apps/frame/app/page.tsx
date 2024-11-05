import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { getFrameUrl } from "./utils";
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cointoss",
    other: {
      ...(await fetchMetadata(new URL("/frames", getFrameUrl()))),
    },
  };
}

export default async function Home() {
  return <div />;
}
