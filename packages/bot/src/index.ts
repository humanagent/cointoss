import { run, HandlerContext } from "@xmtp/message-kit";
import { CurrentStep } from "./lib/types.js";
import {
  TOSS_AMOUNT_ERROR_REPLY,
  TOSS_AMOUNT_REPLY,
  TOSS_MESSAGE_REPLY,
  TOSS_OPTIONS_ERROR_REPLY,
  TOSS_OPTIONS_REPLY,
  TOSS_CREATE_REPLY,
  TOSS_AMOUNT_JUDGE_REPLY,
  TOSS_LIST_REPLY,
  GROUP_MESSAGE_INITIAL,
  NO_PENDING_BETS_ERROR,
} from "./lib/constants.js";
import { createToss } from "./handlers/toss.js";
import { commands } from "./commands.js";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { db } from "./lib/db.js";

import { COINTOSSBOT_ABI } from "./abi/index.js";
import { handleTossCreation } from "./handlers/toss.js";
import { handleReaction, handleText, handleReply } from "./handlers/agent.js";
// track conversation steps
const inMemoryCacheStep = new Map<string, CurrentStep>();
const isStopMessage = (message: string) => {
  const stopMessages = ["stop", "cancel", "exit", "quit", "restart", "reset"];
  return stopMessages.includes(message.toLowerCase());
};

const handleBetList = async (context: HandlerContext) => {
  const {
    message: { sender },
  } = context;

  await context.send(TOSS_LIST_REPLY);

  const publicClient = createPublicClient({ chain: base, transport: http() });
  const betPlacedEvents = await publicClient.getContractEvents({
    abi: COINTOSSBOT_ABI,
    address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
    eventName: "BetPlaced",
    args: { bettor: sender.address as `0x${string}` },
  });
  const betsFrames = await Promise.all(
    betPlacedEvents.map(async (event) => {
      const bet = await publicClient.readContract({
        abi: COINTOSSBOT_ABI,
        address: process.env.COINTOSS_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "bets",
        args: [event.args.betId!],
      });
      return bet[4] === 0
        ? `${process.env.FRAME_URL}/frames/toss/${event.args.betId!}`
        : null;
    }),
  );

  const pendingBets = betsFrames.filter(Boolean);
  if (pendingBets.length === 0) {
    await context.send(NO_PENDING_BETS_ERROR);
  } else {
    await Promise.all(
      pendingBets.map(async (frame) => await context.send(frame!)),
    );
  }
};

const commandHandlers = {
  "/toss": handleTossCreation,
};

function isHelpCommand(text: string) {
  return text.startsWith("/toss help");
}

const handleHelpCommand = async (context: HandlerContext, sender: string) => {
  await context.send(GROUP_MESSAGE_INITIAL);
};

// Example usage
run(
  async (context: HandlerContext) => {
    const {
      message: { content, typeId, sender },
      message,
      group,
      getCacheCreationDate,
    } = context;

    const cacheCreationDate = await getCacheCreationDate();
    if (typeId == "new_group") {
      console.log(
        "cacheCreationDate",
        cacheCreationDate,
        new Date(group?.createdAt!),
      );
      if (
        cacheCreationDate &&
        cacheCreationDate <= new Date(group?.createdAt!)
      ) {
        await db.read();
        if (!db.data?.initialMessages[group ? group.id : sender.address]) {
          db.data.initialMessages[group ? group.id : sender.address] = true;
          //await context.send(GROUP_MESSAGE_INITIAL);
          console.log("initial message sent");
          await db.write();
        }
      }
      return; //important
    } else if (
      typeId === "text" &&
      (content.content.includes("@cointoss") ||
        content.content.includes("🪙") ||
        content.content.includes("💰"))
    ) {
      await handleText(context);
      return;
    } else if (group) {
      if (typeId === "reply") {
        const { content: reply } = content;
        if (reply) {
          await handleReply(context);
          return;
        }
      } else if (typeId === "reaction") {
        const { content: emoji, action } = content;
        if ((emoji === "💰" || emoji === "🪙") && action === "added") {
          await handleReaction(context);
          return;
        }
      }
    }

    const { content: text, params } = content;
    const textLower = text.toLowerCase();
    if (isStopMessage(textLower)) {
      inMemoryCacheStep.delete(sender.address);
      await context.send(TOSS_MESSAGE_REPLY);
      return;
    } else if (isHelpCommand(textLower)) {
      await handleHelpCommand(context, sender.address);
      return;
    } else if (textLower.startsWith("/toss create")) {
      await context.send(TOSS_CREATE_REPLY);
      inMemoryCacheStep.set(sender.address, {
        description: "",
        options: "",
        amount: "",
        judge: "",
      });
      return;
    } else if (
      textLower.startsWith("/toss") &&
      params &&
      params.description !== "" &&
      params.options !== "" &&
      params.amount !== ""
    ) {
      await handleTossCreation(context);
      return;
    } else if (textLower.startsWith("/toss list")) {
      await handleBetList(context);
      return;
    }

    //Return if it's a group message
    if (group || (typeId !== "text" && typeId !== "reply")) return;

    let contentText = content.content ?? content;

    const currentStep = inMemoryCacheStep.get(sender.address);
    if (!currentStep) {
      await context.send(TOSS_MESSAGE_REPLY);
    } else if (!currentStep.description) {
      inMemoryCacheStep.set(sender.address, {
        ...currentStep,
        description: contentText,
      });
      await context.send(TOSS_OPTIONS_REPLY);
    } else if (!currentStep.options) {
      if (!contentText.includes(",") || contentText.split(",").length !== 2) {
        await context.send(TOSS_OPTIONS_ERROR_REPLY);
        return;
      }
      inMemoryCacheStep.set(sender.address, {
        ...currentStep,
        options: contentText,
      });
      await context.send(TOSS_AMOUNT_JUDGE_REPLY);
    } else if (!currentStep.judge) {
      const judge = contentText.length > 10 ? contentText : sender.address;

      inMemoryCacheStep.set(sender.address, {
        ...currentStep,
        judge: judge,
      });
      await context.send(TOSS_AMOUNT_REPLY);
    } else if (!currentStep.amount) {
      if (isNaN(Number(contentText))) {
        await context.send(TOSS_AMOUNT_ERROR_REPLY);
        return;
      }
      await createToss(
        context,
        currentStep.options,
        contentText,
        currentStep.description,
        currentStep.judge,
        sender.address,
      );
      inMemoryCacheStep.delete(sender.address);
    }
  },
  {
    commandHandlers: commandHandlers,
    commands: commands,
  },
);
