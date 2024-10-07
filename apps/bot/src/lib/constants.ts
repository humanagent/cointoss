import dotenv from "dotenv";
dotenv.config();

// ...

export const TAG_NAME = "@cointoss"; /*
  process.env.RAILWAY_SERVICE_ID === "d63a747d-63a3-42bb-9e05-3d1b4300e289"
    ? "@cointoss"
    : process.env.RAILWAY_SERVICE_ID === "e36a4d7b-52f5-431a-9554-9235298f782b"
      ? "@ctdev"
      : "@ctlocal";*/
export const TOSS_MESSAGE_REPLY =
  "Hi, if you want to create a new bet send me a message saying “/toss create” and follow all the steps that I list.";
export const TOSS_CREATE_REPLY =
  "Alright. What's the bet gonna be about? Write a description like “Who is gonna win the Euro Cup?”. Remember bets allow only two options to bet on (boolean conditions).";
export const TOSS_LIST_REPLY = "Here the pending bets that you created:";
export const TOSS_OPTIONS_REPLY =
  "Perfect, what are the betting options the you want to bet on? Separate them with “,” (comma) please.";
export const TOSS_AMOUNT_REPLY =
  "Finally, How much you wanna bet with your friends? I need to know the amount in Base USDC.";
export const TOSS_CONFIRM_REPLY =
  "Now to confirm and send the bet to your friends, please tell me which options you want to bet on. If you did something wrong, press restart to create a new bet from scratch.\n*You might need to approve USDC spending first.";
// error messages
export const TOSS_AMOUNT_JUDGE_REPLY =
  "Who is the judge of this toss? Write the address of the person who will confirm the result of the toss.";
export const TOSS_AMOUNT_ERROR_REPLY =
  "Please enter a valid number for the bet amount.";
// export const TOSS_DURATION_REPLY =
//   "Finally, enter the duration of the bet window. Use the format: 1d, 1w, 1m, 1y.";
// export const TOSS_DURATION_ERROR_REPLY = "Please enter a valid duration.";
export const TOSS_OPTIONS_ERROR_REPLY =
  "Please enter at least two valid options, “,” (comma) separated.";
export const NO_PENDING_BETS_ERROR = "You don't have any pending bets.";

export const GROUP_MESSAGE_FIRST =
  "Here is your toss! \n\nThe creator of the toss is one who can modify and settle the toss. \n\nThe pool will be split evenly with the winners. \n\nRemember, with great power comes great responsibility!";

export const GROUP_MESSAGE_INITIAL = `Hey everyone! \n\n👋 I’m CoinToss, your friendly bot here to add some fun and excitement to our chats. \n\nStart a toss by tagging me in a yes or no question like "${TAG_NAME} Will it rain tomorrow for $10?" and I’ll take care of the rest.`;

export const USER_REPLACEMENTS = {
  "@saul": "0xf0ea7663233f99d0c12370671abbb6cca980a490",
  "@shane": "0xa64af7f78de39a238ecd4fff7d6d410dbace2df0",
  "@fabri": "0x277c0dd35520db4aaddb45d4690ab79353d3368b",
  "@peter": "0x6a03c07f9cb413ce77f398b00c2053bd794eca1a",
  "@naomi": "0x33fa52e6a9dbfca57ed277491dbd8ba5a0b248f4",
  "@ashley": "0x632dd787696585f656d0cba5a052f2276cc98252",
  "@jha": "0x62eed858af7590fbcae803d208c53ddbb0d1309c",
  "@darick": "0x841b4b11c51be2e9a33746b9afe0ba83d188da93",
};
