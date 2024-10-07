import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cointoss",
    other: {
      ...(await fetchMetadata(
        new URL(
          "/frames",
          process.env.FRAME_URL
            ? `https://${process.env.FRAME_URL}`
            : "http://localhost:3000",
        ),
      )),
    },
  };
}

export default async function Home() {
  return <div />;
}
