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
  GROUP_MESSAGE_INITIAL,
} from "./lib/constants.js";
import { createToss } from "./handlers/toss.js";
import { TAG_NAME } from "./lib/constants.js";
import { handleTossCreation, handleBetList } from "./handlers/toss.js";
import { handleReaction, handleText, handleReply } from "./handlers/agent.js";

const inMemoryCacheStep = new Map<string, CurrentStep>();

// Example usage
run(async (context: HandlerContext) => {
  const {
    message: { content, typeId, sender },
    group,
  } = context;

  if (typeId === "text") {
    const { content: text, params } = content;
    const textLower = text.toLowerCase();
    if (textLower.includes(TAG_NAME) || textLower.includes("🪙")) {
      await handleText(context);
      return;
    } else if (textLower.startsWith("/toss help")) {
      await context.send(GROUP_MESSAGE_INITIAL);
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
    } else if (textLower.startsWith("/toss list")) {
      await handleBetList(context);
      return;
    } else if (textLower.startsWith("/toss")) {
      const { content: text, params } = content;

      if (
        params &&
        params.description !== "" &&
        params.options !== "" &&
        params.amount !== ""
      ) {
        await handleTossCreation(context);
        return;
      }
    }
  }

  if (group) {
    if (typeId === "reply") {
      const { content: reply } = content;
      if (reply) {
        await handleReply(context);
        return;
      }
    } else if (typeId === "reaction") {
      const { content: emoji, action } = content;
      if (emoji === "🪙" && action === "added") {
        await handleReaction(context);
        return;
      }
    } else return;
  }

  //v2

  const { content: text, params } = content;
  const stopMessages = ["stop", "cancel", "exit", "quit", "restart", "reset"];
  const textLower = text.toLowerCase();
  if (stopMessages.includes(textLower)) {
    inMemoryCacheStep.delete(sender.address);
    await context.send("Steps reseted");
    return;
  }

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
});
