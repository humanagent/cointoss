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
          "/toss [description] [options (separated by comma)] [amount] [judge(optional)] [endTime(optional)]",
        description:
          "Create a toss with a description, options, amount and judge(optional).",
        handler: handleTossCreation,
        triggers: ["/toss"],
        examples: [
          "/toss 'Shane vs John at pickeball' 'Yes,No' 10",
          "/toss 'Will argentina win the world cup' 'Yes,No' 10",
          "/toss 'Race to the end' 'Fabri,John' 10",
          "/toss 'Will argentina win the world cup' 'Yes,No' 5 '27 Oct 2023 23:59:59 GMT'",
          "/toss 'Will the niks win on sunday?' 'Yes,No' 10 '27 Oct 2023 23:59:59 GMT'",
          "/toss 'Will it rain tomorrow' 'Yes,No' 0",
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
          endTime: {
            type: "quoted",
          },
        },
      },
    ],
  },
];
