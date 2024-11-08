import { Button } from "frames.js/next";
import { frames } from "./frames";

const handleRequest = frames(async (ctx) => {
  return {
    image: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          color: "#25B618",
        }}>
        Cointoss
      </div>
    ),
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
