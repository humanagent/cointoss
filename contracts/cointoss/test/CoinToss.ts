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
    const usdcAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC on Base
    const maxTossingAmountPerOutcome = 10000000;
    const coinToss = await CoinToss.deploy(usdcAddress, maxTossingAmountPerOutcome);

    const usdc = await ethers.getContractAt("IERC20", usdcAddress);

    // USDC Base holders addresses
    const baseHolder1 = "0xe36288736e5a45c27ee6FA2F8d1A1aeD99D3eA63";
    const baseHolder2 = "0x97e8418bE37bb4145f4Fc67266D0cb0761cb48A0";
    const baseHolder3 = "0xaBe8fE965CaAfA63a4537B30eAebe4B97Af52e43";
    const baseHolder4 = "0xe423F4d8d786939fe131Df85A61193afF0370AA9";
    const baseHolder5 = "0x94d5Dec1796404ff3544FB09461AF0bC3fb3c2F6";
    const baseHolder6 = "0xa0e72f85D3ab3920e6Bb17109819Ea7E07Fcf7CF";
    const baseHolder7 = "0x8F1901DcEf5F7b6E2502F1052AfB589F1734F565";
    const baseHolder8 = "0x7Ee7D91E3C4fdDb9AA5Efe0e68F0e40A92A16D93";
    const baseHolder9 = "0xD702F51Fa5a667Ca70440cd3df8DAC53534D1cac";
    const baseHolder10 = "0x05e189E1BbaF77f1654F0983872fd938AE592eDD";


    return { coinToss, owner, otherAccount, usdc, usdcAddress, maxTossingAmountPerOutcome, baseHolder1, baseHolder2, baseHolder3, baseHolder4, baseHolder5, baseHolder6, baseHolder7, baseHolder8, baseHolder9, baseHolder10 };
  }
/*
  describe("Deployment", function () {
    it("Should set the correct tossing token and max tossing amount", async function () {
      const { coinToss, usdcAddress, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      expect((await coinToss.tossingTokenAddress()).toLowerCase()).to.equal(usdcAddress.toLowerCase());
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
      const adminOutcome = 0; // Admin doesn't toss

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

    it("Should not revert if endTime is zero", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = 0;
      const adminOutcome = 0;
      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.emit(coinToss, "TossCreated")
        .withArgs(owner.address, 1, condition, outcomes, tossingAmounts, anyValue);
    });

    it("Should revert if endTime is in the past", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) - 86400;
      const adminOutcome = 0;
      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.be.revertedWithCustomError(coinToss, "EndTimeInPast");
    });

    it("Should revert if tossing amount exceeds max", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome + 1, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;
      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.be.revertedWithCustomError(coinToss, "TossingAmountExceedsMax");
    });

    it("Should revert if condition is empty", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;
      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.be.revertedWithCustomError(coinToss, "InvalidCondition");
    });

    it("Should not revert if tossing amount is zero", async function () {
      const { coinToss, owner, maxTossingAmountPerOutcome } = await loadFixture(deployCoinToss);
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [0, 0];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;
      await expect(coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome))
        .to.emit(coinToss, "TossCreated")
        .withArgs(owner.address, 1, condition, outcomes, tossingAmounts, anyValue);
    });
  });

  describe("Place Toss", function () {
    it("Should allow a player to place a toss", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);
  
      // call erc20 approve impersonating owner
      await usdc.connect(signer1).approve(coinToss.target, ethers.parseUnits("10", 6));
      // Place a toss
      await expect(coinToss.connect(signer1).placeToss(1, 0))
        .to.emit(coinToss, "TossPlaced")
        .withArgs(1, signer1.address, 0, ethers.parseUnits("10", 6));

      expect(await coinToss.playerToss(signer1.address, 1)).to.equal(0);
    });

    it("Should make a toss and distribute winnings", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1, baseHolder2 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);
      const signer2 = await ethers.getImpersonatedSigner(baseHolder2);

      const signer1BalanceBefore = await usdc.balanceOf(signer1.address);

      // Place tosses
      await usdc.connect(signer1).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer1).placeToss(1, 0);

      await usdc.connect(signer2).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer2).placeToss(1, 1);

      // Skip time to after the end time
      await time.increase(86401*2); // 48 hours

      // Resolve toss
      await coinToss.connect(owner).resolveToss(1, 0, true);

      // Check winnings
      const signer1BalanceAfter = await usdc.balanceOf(signer1.address);
      const expectedWinnings = ethers.parseUnits("10", 6); // Winning their 10 USDC back plus 10 USDC from the other player
      expect(signer1BalanceAfter).to.equal(signer1BalanceBefore + expectedWinnings);
    });

    it("Should revert if try to place a toss twice", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);

      // Place first toss
      await usdc.connect(signer1).approve(coinToss.target, ethers.parseUnits("20", 6));
      await coinToss.connect(signer1).placeToss(1, 0);

      // Try to place second toss
      await expect(coinToss.connect(signer1).placeToss(1, 1))
        .to.be.revertedWithCustomError(coinToss, "PlayerAlreadyTossed");
    });

    it("10 players make a toss (mixed outcomes) and resolve with distribute winnings", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1, baseHolder2, baseHolder3, baseHolder4, baseHolder5, baseHolder6, baseHolder7, baseHolder8, baseHolder9, baseHolder10 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signers = await Promise.all([baseHolder1, baseHolder2, baseHolder3, baseHolder4, baseHolder5, baseHolder6, baseHolder7, baseHolder8, baseHolder9, baseHolder10].map(holder => ethers.getImpersonatedSigner(holder)));

      const balancesBefore = await Promise.all(signers.map(signer => usdc.balanceOf(signer.address)));

      // Place tosses
      for (let i = 0; i < signers.length; i++) {
        await usdc.connect(signers[i]).approve(coinToss.target, ethers.parseUnits("10", 6));
        await coinToss.connect(signers[i]).placeToss(1, i % 2); // Alternating between 0 and 1
      }

      // Skip time to after the end time
      await time.increase(86401*2); // 48 hours

      // Resolve toss
      await coinToss.connect(owner).resolveToss(1, 0, true);

      // Check winnings for winners (those who chose outcome 0)
      for (let i = 0; i < signers.length; i += 2) {
        const balanceAfter = await usdc.balanceOf(signers[i].address);
        expect(balanceAfter).greaterThanOrEqual(balancesBefore[i])
      }

      // Check losses for losers (those who chose outcome 1)
      for (let i = 1; i < signers.length; i += 2) {
        const balanceAfter = await usdc.balanceOf(signers[i].address);
        expect(balanceAfter).lessThan(balancesBefore[i])
      }
    });

    it("2 players make a 0$ toss and resolve", async function () {
      const { coinToss, owner, usdc, baseHolder1, baseHolder2 } = await loadFixture(deployCoinToss);
      
      // Create a toss with 0 tossing amounts
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [0, 0];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);
      const signer2 = await ethers.getImpersonatedSigner(baseHolder2);

      // Place 0$ tosses
      await coinToss.connect(signer1).placeToss(1, 0);
      await coinToss.connect(signer2).placeToss(1, 1);

      // Skip time to after the end time
      await time.increase(86401*2); // 40 hours

      // Resolve toss
      await coinToss.connect(owner).resolveToss(1, 0, true);

      // Check that balances haven't changed
      const signer1BalanceAfter = await usdc.balanceOf(signer1.address);
      const signer2BalanceAfter = await usdc.balanceOf(signer2.address);
      
      expect(signer1BalanceAfter).to.equal(await usdc.balanceOf(signer1.address));
      expect(signer2BalanceAfter).to.equal(await usdc.balanceOf(signer2.address));

      //expect status to be PAID
      expect((await coinToss.tossInfo(1))[0].status).to.equal(1);
    });

    it("Should revert when trying to resolve a toss before end time", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1, baseHolder2 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);
      const signer2 = await ethers.getImpersonatedSigner(baseHolder2);

      // Place tosses
      await usdc.connect(signer1).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer1).placeToss(1, 0);

      await usdc.connect(signer2).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer2).placeToss(1, 1);

      // Try to resolve toss before end time
      await expect(coinToss.connect(owner).resolveToss(1, 0, true))
        .to.be.revertedWithCustomError(coinToss, "TossNotEnded");
    });

    
  });
*/
  describe("Admin and User Pause/Return Actions", function () {
    it("Admin pauses toss and transfer back funds to players", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1, baseHolder2 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);
      const signer2 = await ethers.getImpersonatedSigner(baseHolder2);

      // Record initial balances
      const initialBalance1 = await usdc.balanceOf(signer1.address);
      const initialBalance2 = await usdc.balanceOf(signer2.address);

      // Place tosses
      await usdc.connect(signer1).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer1).placeToss(1, 0);

      await usdc.connect(signer2).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer2).placeToss(1, 1);

      // Admin returns toss
      await coinToss.connect(owner).adminReturnToss(1);

      // Check toss status
      const [toss, , ] = await coinToss.tossInfo(1);
      expect(toss.status).to.equal(1); // TossStatus.PAID

      // Check balances are restored
      const finalBalance1 = await usdc.balanceOf(signer1.address);
      const finalBalance2 = await usdc.balanceOf(signer2.address);

      expect(finalBalance1).to.equal(initialBalance1);
      expect(finalBalance2).to.equal(initialBalance2);
    });

    it("Admin pauses toss and users claim funds", async function () {
      const { coinToss, owner, usdc, maxTossingAmountPerOutcome, baseHolder1, baseHolder2 } = await loadFixture(deployCoinToss);
      
      // Create a toss
      const condition = "Will it snow tomorrow?";
      const outcomes = ["Yes", "No"];
      const tossingAmounts = [maxTossingAmountPerOutcome, maxTossingAmountPerOutcome];
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      const adminOutcome = 0;

      await coinToss.createToss(owner.address, condition, outcomes, tossingAmounts, endTime, adminOutcome);

      const signer1 = await ethers.getImpersonatedSigner(baseHolder1);
      const signer2 = await ethers.getImpersonatedSigner(baseHolder2);

      // Record initial balances
      const initialBalance1 = await usdc.balanceOf(signer1.address);
      const initialBalance2 = await usdc.balanceOf(signer2.address);

      // Place tosses
      await usdc.connect(signer1).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer1).placeToss(1, 0);

      await usdc.connect(signer2).approve(coinToss.target, ethers.parseUnits("10", 6));
      await coinToss.connect(signer2).placeToss(1, 1);

      // Admin pauses toss
      await coinToss.connect(owner).adminPauseToss(1);

      // Check toss status
      let [toss, , ] = await coinToss.tossInfo(1);
      expect(toss.status).to.equal(2); // TossStatus.PAUSED

      // Users claim their tokens
      await coinToss.connect(signer1).claimTokensFromPausedToss(1);
      await coinToss.connect(signer2).claimTokensFromPausedToss(1);

      // Check balances are restored
      const finalBalance1 = await usdc.balanceOf(signer1.address);
      const finalBalance2 = await usdc.balanceOf(signer2.address);

      expect(finalBalance1).to.equal(initialBalance1);
      expect(finalBalance2).to.equal(initialBalance2);

      // Verify that players can't claim twice
      await expect(coinToss.connect(signer1).claimTokensFromPausedToss(1)).to.be.revertedWithCustomError(coinToss, "PlayerDidNotToss");
      await expect(coinToss.connect(signer2).claimTokensFromPausedToss(1)).to.be.revertedWithCustomError(coinToss, "PlayerDidNotToss");
    });
  });
});
