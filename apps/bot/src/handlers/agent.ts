import { HandlerContext } from "@xmtp/message-kit";
import { textGeneration } from "../lib/openai.js";
import { USER_REPLACEMENTS, TAG_NAME } from "../lib/constants.js";
import { hexToBytes } from "viem";

export async function handleText(context: HandlerContext) {
  if (!process?.env?.OPEN_AI_API_KEY) {
    console.log("No OPEN_AI_API_KEY found in .env");
    return;
  }

  const {
    message: {
      content: { content, params },
    },
  } = context;

  const systemPrompt = generateSystemPrompt(context);
  try {
    let userPrompt = params?.prompt ?? content;

    Object.entries(USER_REPLACEMENTS).forEach(([user, address]) => {
      userPrompt = userPrompt.replace(user, address);
    });

    if (process?.env?.MSG_LOG === "true") {
      console.log("userPrompt", userPrompt);
    }

    const { reply } = await textGeneration(userPrompt, systemPrompt);
    console.log("reply", reply);
    await context.intent(reply);
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    await context.reply("An error occurred while processing your request.");
  }
}

function generateSystemPrompt(context: HandlerContext) {
  const systemPrompt = `You are a helpful and playful betting bot that lives inside a web3 messaging group.\n

    Users can start a toss by tagging you in a yes or no question like '${TAG_NAME} Will it rain tomorrow for $10?' and I’ll take care of the rest.";

    You then have an internal command to create a toss: "/toss [description] [options (separated by comma)] [amount] [judge(optional)]"

    Format examples:

    /toss "Who will win the match?" "Nadal, Federer" 10  0x3d6B372f705BDAE687927725A42333AB94dFA531
    /toss "Will [person] skip breakfast?" "Yes, No" 5 0x3d6B372f705BDAE687927725A42333AB94dFA531
    /toss "Who wins the next NBA game?" "Lakers, Heat" 25 
    
    Important rules:

    - The token is always USDC. Ignore other tokens and default to usdc.
    - Infer the name of the toss from the prompt if it's not provided. It should be a short sentence summarizing the event, never mention the options.
    - Tosses must always have two options. If options are not provided, assume "Yes" and "No."
    - For sports events, ensure the options are the two teams or players, as inferred from the context.
    - If the user provides unclear or incomplete information, infer and generate the correct toss format based on context.
    - Maximum toss amount is 1000. Default to 10 if nothing is provided. Minimum is 0.00
    - Don't mention options in the toss name.
    - Add emojis to the options if you see it fit. Only very literal emojis like countries, flags, etc.
    - If toss is correct. Don't return anything else than the command. Ever.

    If the user asks about performing an action and it maps to a command, answer directly with the populated command. Always return commands with real values only.
    If the user's input doesn't clearly map to a command, respond with helpful information or a clarification question.
  `;
  //Don't return anything else than the command. Ever.
  return systemPrompt;
}

export async function handleReaction(context: HandlerContext) {
  const {
    message: { content },
    members,
    getMessageById,
  } = context;

  const { content: emoji, action, reference } = content;

  const msg = await getMessageById(reference);

  const receiver = members?.find(
    (member) => member.inboxId === msg?.senderInboxId,
  );

  const systemPrompt = generateSystemPrompt(context);
  try {
    let userPrompt = msg?.content;

    Object.entries(USER_REPLACEMENTS).forEach(([user, address]) => {
      userPrompt = userPrompt.replace(user, address);
    });

    if (process?.env?.MSG_LOG === "true") {
      console.log("userPrompt", userPrompt);
    }
    const { reply } = await textGeneration(userPrompt, systemPrompt);
    console.log("reply", reply);
    context.intent(reply);
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    await context.reply("An error occurred while processing your request.");
  }
  //emoji, action, msg?.content,receiver?.address
}

export async function handleReply(context: HandlerContext) {
  const {
    message: { content },
    v2client,
    getReplyChain,
    version,
  } = context;
  const { content: reply, reference } = content;

  const { chain, isSenderInChain } = await getReplyChain(
    reference,
    version,
    v2client.address,
  );

  let userPrompt = `The following is a conversation history:\n${chain
    .map((content) => `- ${content.content}`)
    .join("\n")}\nLatest reply: ${reply}.`;

  if (
    !userPrompt.includes(TAG_NAME) &&
    !userPrompt.includes("🪙") &&
    !userPrompt.includes("💰") &&
    !isSenderInChain
  )
    return;

  const systemPrompt = generateSystemPrompt(context);
  try {
    Object.entries(USER_REPLACEMENTS).forEach(([user, address]) => {
      userPrompt = userPrompt.replace(user, address);
    });

    if (process?.env?.MSG_LOG === "true") {
      console.log("userPrompt", userPrompt);
    }
    userPrompt =
      userPrompt +
      "\nIf you dont detect intent in the last message, dont reply.";
    const { reply: replyPrompt } = await textGeneration(
      userPrompt,
      systemPrompt,
    );
    console.log("replyPrompt", replyPrompt);
    if (replyPrompt.startsWith("/")) context.intent(replyPrompt);
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    await context.reply("An error occurred while processing your request.");
  }
}
