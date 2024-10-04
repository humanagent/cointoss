import { farcasterHubContext, openframes } from "frames.js/middleware";
import { createFrames } from "frames.js/next";
import { isXmtpFrameActionPayload, getXmtpFrameMessage } from "frames.js/xmtp";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export type State = {
  count: number;
};

export const frames = createFrames<State>({
  initialState: {
    count: 0,
  },
  basePath: "/frames",
  imageRenderingOptions: async () => {
    const overpass = fs.readFile(
      path.join(path.resolve(process.cwd(), "public"), "Overpass-Regular.ttf"),
    );
    const overpassBold = fs.readFile(
      path.join(path.resolve(process.cwd(), "public"), "Overpass-Bold.ttf"),
    );
    const overpassItalic = fs.readFile(
      path.join(path.resolve(process.cwd(), "public"), "Overpass-Italic.ttf"),
    );
    const vanguardBold = fs.readFile(
      path.join(path.resolve(process.cwd(), "public"), "Vanguard-Bold.otf"),
    );

    const [
      overpassFont,
      overpassBoldFont,
      overpassItalicFont,
      vanguardBoldFont,
    ] = await Promise.all([
      overpass,
      overpassBold,
      overpassItalic,
      vanguardBold,
    ]);

    return {
      imageOptions: {
        fonts: [
          {
            name: "Overpass",
            data: overpassFont,
            weight: 400,
          },
          {
            name: "Overpass-Bold",
            data: overpassBoldFont,
            weight: 700,
          },
          {
            name: "Overpass-Italic",
            data: overpassItalicFont,
            weight: 400,
            style: "italic",
          },
          {
            name: "Vanguard-Bold",
            data: vanguardBoldFont,
            weight: 700,
          },
        ],
      },
    };
  },
  middleware: [
    farcasterHubContext({
      // remove if you aren't using @frames.js/debugger or you just don't want to use the debugger hub
      ...(process.env.NODE_ENV === "production"
        ? {
            hubHttpUrl: "https://hubs.airstack.xyz",
            hubRequestOptions: {
              headers: {
                "x-airstack-hubs": process.env.AIRSTACK_API_KEY as string,
              },
            },
          }
        : {
            hubHttpUrl: "http://localhost:3010/hub",
          }),
    }),
    // Learn more about openframes at https://framesjs.org/guides/open-frames
    openframes({
      clientProtocol: {
        id: "xmtp",
        version: "2024-02-09",
      },
      handler: {
        isValidPayload: (body) => isXmtpFrameActionPayload(body),
        getFrameMessage: async (body) => {
          // Check if the payload is a valid XMTP frame action payload
          if (!isXmtpFrameActionPayload(body)) {
            // If it's not, return undefined
            console.error("Invalid XMTP payload");
            return undefined;
          }
          // If it is, get the frame message
          const result = await getXmtpFrameMessage(body);

          return { ...result };
        },
      },
    }),
  ],
});
