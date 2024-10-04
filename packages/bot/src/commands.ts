import type { CommandGroup } from "@xmtp/message-kit";

export const commands: CommandGroup[] = [
  {
    name: "Toss",
    icon: "💸",
    description: "Tossing commands.",
    commands: [
      {
        command:
          "/toss [description] [options (separated by comma)] [amount] [judge(optional)]",
        description:
          "Create a toss with a description, options, amount and judge(optional).",
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
