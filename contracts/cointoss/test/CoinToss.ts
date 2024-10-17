import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("CoinToss", function () {
  async function deployCoinToss() {
    const [owner, otherAccount] = await ethers.getSigners();

    const CoinToss = await ethers.getContractFactory("CoinToss");
    const usdcAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC on Arbitrum
    const maxTossingAmountPerOutcome = 10000000;
    const coinToss = await CoinToss.deploy(usdcAddress, maxTossingAmountPerOutcome);

    const usdc = await ethers.getContractAt("IERC20", usdcAddress);

    return { coinToss, owner, otherAccount, usdc, maxTossingAmountPerOutcome };
  }

  describe("Deployment", function () {
    it("Should set the correct tossing token and max tossing amount", async function () {
      const { coinToss, usdc, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      expect(await coinToss.tossingTokenAddress()).to.equal(usdc);
      expect(await coinToss.maxTossingAmountPerOutcome()).to.equal(maxTossingAmountPerOutcome);
    });

    it("Should initialize tossId to 0", async function () {
      const { coinToss } = await loadFixture(deployCoinToss);
      expect(await coinToss.tossId()).to.equal(0);
    });
  });

  describe("Create Toss", function () {
    it("Should create a toss", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      const adminOutcome = 0; // Admin doesn't bet

      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.emit(coinToss, "TossCreated")
        .withArgs(owner.address, 1, condition, outcomes, tossingAmounts, anyValue);

      const [tossInfo, tossOutcomes, tossTossingAmounts] = await coinToss.tossInfo(1);
      expect(tossInfo.admin).to.equal(owner.address);
      expect(tossInfo.condition).to.equal(condition);
      expect(tossOutcomes).to.deep.equal(outcomes);
      expect(tossTossingAmounts).to.deep.equal(tossingAmounts);
    });

    it("Should revert if outcomes and tossing amounts mismatch", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome]; // Only one amount
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.be.revertedWithCustomError(coinToss, "OutcomesAndAmountsMismatch");
    });

    it("Should revert if less than two outcomes", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes"];
      const tossingAmounts = [maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.be.revertedWithCustomError(coinToss, "AtLeastTwoOutcomesRequired");
    });
  });

  describe("Place Toss", function () {
    it("Should allow a player to place a toss", async function () {
      const { coinToss, owner, otherAccount, usdc, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      // Approve USDC spending
      await usdc.connect(otherAccount).approve(coinToss.target, ethers.parseUnits("10", 6));

      // Place a toss
      await expect(coinToss.connect(otherAccount).placeToss(1, 0))
        .to.emit(coinToss, "TossPlaced")
        .withArgs(1, otherAccount.address, 0, ethers.parseUnits("10", 6));

      expect(await coinToss.playerToss(otherAccount.address, 1)).to.equal(0);
    });

    it("Should revert if player tries to toss twice", async function () {
      const { coinToss, owner, otherAccount, usdc } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [ethers.parseUnits("10", 6), ethers.parseUnits("10", 6)];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      // Approve USDC spending
      await usdc.connect(otherAccount).approve(coinToss.target, ethers.parseUnits("20", 6));

      // Place a toss
      await coinToss.connect(otherAccount).placeToss(1, 0);

      // Try to place another toss
      await expect(coinToss.connect(otherAccount).placeToss(1, 1))
        .to.be.revertedWithCustomError(coinToss, "PlayerAlreadyTossed");
    });
  });

  // Add more test cases for other functions like resolveToss, distributeWinnings, etc.
});
