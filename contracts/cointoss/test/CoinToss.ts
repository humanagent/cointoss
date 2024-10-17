import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { bytesToString } from "viem";

describe("SimpleBettingBot", function () {
  async function deployBettingBot() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const BettingBot = await hre.ethers.getContractFactory("SimpleBettingBot");
    const usdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
    const bettingBot = await BettingBot.deploy(usdc);
    const erc20 = await ethers.getContractAt("IERC20", "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");

    return { bettingBot, owner, otherAccount, erc20 };
  }

  describe("Deployment", function () {
    it(" Deployment", async function () {
      const { bettingBot } = await loadFixture(deployBettingBot);
      expect(await bettingBot.betId()).to.equal(0);
    });
  });

  describe("Create Bet", function () {
      describe("Create standard bet", function () {
        it("Should create a bet", async function () {
          const { bettingBot, owner } = await loadFixture(deployBettingBot);
          // create bet params
          const groupId = 1;
          const condition = ("test");
          console.log("condition", condition);
          const outcome1 = ("test1");
          console.log("outcome1", outcome1);
          const outcome2 = ("test2");
          console.log("outcome2", outcome2);
          const outcomes = [outcome1, outcome2];
          const bettingOdds = [1000, 1000];
          const endTime = 1722893821;
          const adminOutcome = 0;
          // static call to get betId
          const betId = await bettingBot.createBet.staticCall(owner, condition, outcomes, bettingOdds/*, endTime*/, adminOutcome);
          console.log("betId", betId);
          // create bet
          await bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/adminOutcome);
          expect(betId).to.equal(1);
          const outcomesResult = await bettingBot.bets(1);
          const betOutcomes0 = await bettingBot.outcomesBet(1, 0);
          const betOutcomes1 = await bettingBot.outcomesBet(1, 1);
          const bettingAmmounts0 = await bettingBot.bettingAmountsBet(1, 0);
          const bettingAmmounts1 = await bettingBot.bettingAmountsBet(1, 1);
          const betInfo = await bettingBot.betInfo(1);
          
          expect(outcomesResult.condition).to.equal(condition);
        });
        it("Should create multiple bets", async function () {
          const { bettingBot, owner } = await loadFixture(deployBettingBot);
          // create bet params
          const groupId = 1;
          const condition = ("test");
          const outcome1 = ("test1");
          const outcome2 = ("test2");
          const outcomes = [outcome1, outcome2];
          const bettingOdds = [1000, 1000];
          const startTime = 0;
          const endTime = 1722893821;
          const bettingToken = "0x9e6be44cc1236eef7e1f197418592d363bedcd5a" // test token address
          const adminOutcome = 0;
          // static call to get betId
          const betId = await bettingBot.createBet.staticCall(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome);
          // create bet
          await bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome);
          expect(betId).to.equal(1);
          // static call to get betId
          const betId2 = await bettingBot.createBet.staticCall(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome);
          // create bet
          await bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome);
          expect(betId2).to.equal(2);
          // static call to get betId
          const betId3 = await bettingBot.createBet.staticCall(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome);
          // create bet
          await bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome);
          expect(betId3).to.equal(3);
        });
        it("should not create a bet if outcomes and betting amount are different", async function () {
          const { bettingBot, owner } = await loadFixture(deployBettingBot);
          // create bet params
          const groupId = 1;
          const condition = ("test");
          const outcome1 = ("test1");
          const outcomes = [outcome1];
          const bettingOdds = [1000, 1000];
          const startTime = 0;
          const endTime = 1722893821;
          const bettingToken = "0x9e6be44cc1236eef7e1f197418592d363bedcd5a" // test token address
          const adminOutcome = 0;
          // create bet
          await expect(bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome)).to.be.revertedWith("Outcomes and betting amounts length mismatch");
        });
        it("should not create a bet if outcomes is 1", async function () {
          const { bettingBot, owner } = await loadFixture(deployBettingBot);
          // create bet params
          const groupId = 1;
          const condition = ("test");
          const outcome1 = ("test1");
          const outcomes = [outcome1];
          const bettingOdds = [1000];
          const startTime = 0;
          const endTime = 1722893821;
          const bettingToken = "0x9e6be44cc1236eef7e1f197418592d363bedcd5a" // test token address
          const adminOutcome = 0;
          // create bet
          await expect(bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome)).to.be.revertedWith("At least 2 outcomes required");
        });
        
        it("should not create a bet if end time is in the past", async function () {
          const { bettingBot, owner } = await loadFixture(deployBettingBot);
          // create bet params
          const groupId = 1;
          const condition = ("test");
          const outcome1 = ("test1");
          const outcome2 = ("test2");
          const outcomes = [outcome1, outcome2];
          const bettingOdds = [1000, 1000];
          const startTime = 0;
          const endTime = 32323;
          const bettingToken = "0x9e6be44cc1236eef7e1f197418592d363bedcd5a" // test token address
          const adminOutcome = 0;
          // create bet
          await expect(bettingBot.createBet(owner, condition, outcomes, bettingOdds, /*, endTime*/ adminOutcome)).to.be.revertedWith("End time must be in the future");
        });
      });
  });
});