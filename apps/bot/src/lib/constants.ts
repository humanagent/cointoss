import dotenv from "dotenv/config";

export const TAG_NAME = "@cointoss"; /*
  process.env.RAILWAY_SERVICE_ID === "d63a747d-63a3-42bb-9e05-3d1b4300e289"
    ? "@cointoss"
    : process.env.RAILWAY_SERVICE_ID === "e36a4d7b-52f5-431a-9554-9235298f782b"
      ? "@ctdev"
      : "@ctlocal";*/
export const TOSS_MESSAGE_REPLY =
  "Hi, if you want to create a new toss send me a message saying “/toss create” and follow all the steps that I list.";
export const TOSS_CREATE_REPLY =
  "Alright. What's the toss gonna be about? Write a description like “Who is gonna win the Euro Cup?”. Remember bets allow only two options to toss on (boolean conditions).";
export const TOSS_LIST_REPLY = "Here the pending bets that you created:";
export const TOSS_OPTIONS_REPLY =
  "Perfect, what are the betting options the you want to toss on? Separate them with “,” (comma) please.";
export const TOSS_AMOUNT_REPLY =
  "Finally, How much you wanna toss with your friends? I need to know the amount in Base USDC.";
export const TOSS_CONFIRM_REPLY =
  "Now to confirm and send the toss to your friends, please tell me which options you want to toss on. If you did something wrong, press restart to create a new toss from scratch.\n*You might need to approve USDC spending first.";
// error messages
export const TOSS_AMOUNT_JUDGE_REPLY =
  "Who is the judge of this toss? Write the address of the person who will confirm the result of the toss.";
export const TOSS_AMOUNT_ERROR_REPLY =
  "Please enter a valid number for the toss amount.";
// export const TOSS_DURATION_REPLY =
//   "Finally, enter the duration of the toss window. Use the format: 1d, 1w, 1m, 1y.";
// export const TOSS_DURATION_ERROR_REPLY = "Please enter a valid duration.";
export const TOSS_OPTIONS_ERROR_REPLY =
  "Please enter at least two valid options, “,” (comma) separated.";
export const NO_PENDING_TOSSES_ERROR = "You don't have any pending tosses.";

export const GROUP_MESSAGE_FIRST =
  "Here is your toss! \n\nThe creator of the toss is one who can modify and settle the toss. \n\nThe pool will be split evenly with the winners. \n\nRemember, with great power comes great responsibility!";

export const GROUP_MESSAGE_INITIAL = `Hey everyone! \n\n👋 I’m CoinToss, your friendly bot here to add some fun and excitement to our chats. \n\nStart a toss by tagging me in a yes or no question like "${TAG_NAME} Will it rain tomorrow for $10?" and I’ll take care of the rest.`;
