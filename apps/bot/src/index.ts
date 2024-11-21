import {
  run,
  agentReply,
  replaceVariables,
  XMTPContext,
  SkillGroup,
} from "@xmtp/message-kit";
import { systemPrompt } from "./prompt.js";
import { registerSkill as tossSkill } from "./handlers/toss.js";
export const frameUrl = process.env.FRAME_URL || "http://localhost:3000";
export const ensUrl = "https://app.ens.domains/";
export const txpayUrl = "https://txpay.vercel.app";

export const skills: SkillGroup[] = [
  {
    name: "Toss Bot",
    tag: "@cointoss",
    description: "Create a coin toss.",
    skills: [...tossSkill],
  },
];

run(
  async (context: XMTPContext) => {
    const {
      message: { sender },
      skills,
    } = context;

    let prompt = await replaceVariables(
      systemPrompt,
      sender.address,
      skills,
      skills[0]?.tag as string,
    );
    await agentReply(context, prompt);
  },
  { skills },
);
