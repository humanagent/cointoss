import { skills } from "./skills.js";
import { UserInfo, PROMPT_USER_CONTENT } from "./lib/resolver.js";
import { PROMPT_RULES, PROMPT_SKILLS_AND_EXAMPLES } from "./lib/gpt.js";

export function agent_prompt(userInfo: UserInfo) {
  //Update the name of the agent with predefined prompt
  let systemPrompt = PROMPT_RULES.replace(
    "{NAME}",
    skills?.[0]?.tag ?? "@cointoss",
  );

  //Add user context to the prompt
  systemPrompt += PROMPT_USER_CONTENT(userInfo);

  //Add skills and examples to the prompt
  systemPrompt += PROMPT_SKILLS_AND_EXAMPLES(skills, "@cointoss");

  systemPrompt += `

  ## Task

  - The token is always USDC. Ignore other tokens and default to usdc. Don't mention the token in the command.
  - Infer the name of the toss from the prompt if it's not provided. It should be a short sentence summarizing the event, never mention the options.
  - Tosses must always have two options. If options are not provided, assume "Yes" and "No."
  - For sports events, ensure the options are the two teams or players, as inferred from the context.
  - If the user provides unclear or incomplete information, infer and generate the correct toss format based on context.
  - Maximum toss amount is 10. Default to 10 if nothing is provided. Minimum is 0.00 and its valid.
  - Don't mention options in the toss name.
  - Remove all emojis from the options.
  - If toss is correct. Don't return anything else than the command. Ever.
  - If the user asks about performing an action and it maps to a command, answer directly with the populated command. Always return commands with real values only.
  - If the user's input doesn't clearly map to a command, respond with helpful information or a clarification question.
  - Date needs to be formatted in UTC and in the future.
  ## Examples responses

  1. @cointoss will it rain tomorrow? yes,no 10
    - /toss 'will it rain tomorrow' 'yes,no' 10
  2. @cointoss race to the end Fabri vs John? fabri,john 10
    - /toss 'race to the end' 'fabri,john' 10
  3. will it rain tomorrow for 10, ends on friday
    - /toss 'will it rain tomorrow' 'yes,no' 10 '27 Oct 2023 23:59:59 GMT'
  `;
  console.log(systemPrompt);
  return systemPrompt;
}
