import type { CommandGroup } from "@xmtp/message-kit";
import { handleTossCreation } from "./handlers/toss.js";

export const commands: CommandGroup[] = [
  {
    name: "Toss",
    description: "Tossing commands.",
    triggers: ["/toss", "@cointoss", "🪙"],
    commands: [
      {
        command:
          "/toss [description] [options (separated by comma)] [amount] [judge(optional)]",
        description:
          "Create a toss with a description, options, amount and judge(optional).",
        handler: handleTossCreation,
        params: {
          description: {
            type: "quoted",
          },
          options: {
            default: "Yes, No",
            type: "quoted",
          },
          amount: {
            type: "number",
          },
          judge: {
            type: "address",
          },
        },
      },
      {
        command: "/toss help",
        description: "Show help for toss commands.",
        params: {},
      },
    ],
  },
];
