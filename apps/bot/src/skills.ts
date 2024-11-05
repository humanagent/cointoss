import type { SkillGroup } from "@xmtp/message-kit";
import { handleTossCreation } from "./handlers/toss.js";
import { tossAgent } from "./handlers/agent.js";

export const skills: SkillGroup[] = [
  {
    name: "Toss",
    description: "Tossing commands.",
    tag: "@cointoss",
    tagHandler: tossAgent,
    skills: [
      {
        command:
          "/toss [description] [options (separated by comma)] [amount] [judge(optional)]",
        description:
          "Create a toss with a description, options, amount and judge(optional).",
        handler: handleTossCreation,
        triggers: ["/toss"],
        examples: [
          "/toss Shane vs John at pickeball",
          "/toss Will argentina win the world cup",
          "/toss Race to the end Fabri vs John for 10",
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
