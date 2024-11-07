import type { SkillGroup } from "@xmtp/message-kit";
import { handleTossCreation } from "./handlers/toss.js";

export const skills: SkillGroup[] = [
  {
    name: "Toss",
    description: "Tossing commands.",
    tag: "@cointoss",
    skills: [
      {
        command:
          "/toss [description] [options (separated by comma)] [amount] [judge(optional)]",
        description:
          "Create a toss with a description, options, amount and judge(optional).",
        handler: handleTossCreation,
        triggers: ["/toss"],
        examples: [
          "/toss 'Shane vs John at pickeball' 'yes,no' 10",
          "/toss 'Will argentina win the world cup' 'yes,no' 10",
          "/toss 'Race to the end' 'Fabri,John' 10",
          "/toss 'Will argentina win the world cup' 'yes,no' 10",
          "/toss 'Will it rain tomorrow' 'yes,no' 0",
        ],
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
    ],
  },
];
