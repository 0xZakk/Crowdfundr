const hre = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { parseEther, formatEther } = require("ethers/lib/utils");

chai.use(solidity);

const { expect } = chai;

describe("Campaign contract", function () {
  let Campaign;
  let campaign;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let testData = {
    title: "Test Campaign",
    fundingGoal: parseEther("10"),
  };

  beforeEach(async function () {
    Campaign = await ethers.getContractFactory("Campaign");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    let { title, fundingGoal } = testData;

    campaign = await Campaign.deploy(title, fundingGoal);
    await campaign.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await campaign.owner()).to.equal(owner.address);
    });
  });

  describe("Create", function () {
    it("Should set the title", async function () {
      expect(await campaign.title()).to.equal(testData.title);
    });

    it("Should set the campaign end date to 30 days from now", async function () {
      // 30 days from now:
      const campaignCreatedDate = await campaign.createdAt();
      const campaignEndDate = await campaign.endDate();

      let diff = campaignEndDate - campaignCreatedDate;
      expect(diff).to.equal(60 * 60 * 24 * 30);
    });

    it("Should set the funding goal", async function () {
      expect(await campaign.fundingGoal()).to.equal(testData.fundingGoal);
    });
  });

  describe("Contribute", function () {
    it("Should not be able to contribute below the minimum (0.01 Eth)", async function () {
      await expect(
        campaign.contribute({ value: parseEther("0.001") })
      ).to.be.revertedWith("The minimum contribution is 0.01 ether");
    });

    it("Should take contributions and increase the balance", async function () {
      const value = parseEther("1");
      await campaign.contribute({ value });
      const newBalance = await campaign.balance();

      expect(newBalance).to.equal(value);
    });

    it("Should accept people aping TF in with all their NFT winnings", async function () {
      const value = parseEther("100");
      await campaign.connect(addr1).contribute({ value });
      const balance = await campaign.balance();

      expect(balance).to.equal(value);
    });

    it("Should emit the ContributionReceived event", async function () {
      const value = parseEther("1");
      await expect(campaign.contribute({ value }))
        .to.emit(campaign, "ContributionReceived")
        .withArgs(owner.address, value, "Gold");
    });

    it("Should return the number of contributions of an address", async function () {
      await campaign.contribute({ value: parseEther("1.25") });
      await campaign.contribute({ value: parseEther(".25") });

      const contributions = await campaign.balanceOf();

      await expect(contributions.toNumber()).to.equal(2);
    });

    it("Should return the total contribution (value) of an address", async function () {
      const cont1 = parseEther("1");
      const cont2 = parseEther("2");
      const cont3 = parseEther("3");

      await campaign.connect(addr1).contribute({ value: cont1 });
      await campaign.connect(addr1).contribute({ value: cont2 });
      await campaign.connect(addr1).contribute({ value: cont3 });

      const contributions = await campaign.connect(addr1).totalContributions();

      await expect(contributions).to.equal(parseEther("6"));
    });
  });

  // describe("Tiers", function () {
  //   it('Should return a Bronze tier NFT for base contributions', function () {

  //   });

  //   it('Should return a Silver NFT for contributions above 0.25 Eth', function () {

  //   });

  //   it('Should return a Gold tier NFT for contributions above 1 Eth', function () {

  //   });
  // })

  describe("Campaign Management", function () {
    it("Should be able to get the campaign's status", async function () {
      const status = await campaign.getStatus();
      expect(status).to.be.true;
    });

    it("Should be cancelable by the owner", async function () {
      await campaign.cancel("Don't want to do it anymore.");
      const status = await campaign.getStatus();
      await expect(status).to.be.false;
    });

    it("Should only be cancelable by the owner", async function () {
      await expect(
        campaign.connect(addr1).cancel("Don't want to do it anymore.")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit a CampaignCancelled event", async function () {
      await expect(campaign.cancel("Don't want to do it anymore."))
        .to.emit(campaign, "CampaignCancelled")
        .withArgs(
          testData.title,
          owner.address,
          "Don't want to do it anymore."
        );
    });

    it("Should block contributions once the campaign is cancelled", async function () {
      await campaign.cancel("Don't want to do it anymore.");
      await expect(
        campaign.connect(addr1).contribute({ value: parseEther("2") })
      ).to.be.revertedWith("Campaign closed, no more contributions accepted.");
    });
  });

  describe("Funding", function () {
    it("Should set the status to inactive when the funding goal is met", async function () {
      await campaign.contribute({
        value: parseEther("10"),
      });

      const active = await campaign.getStatus();
      expect(active).to.be.false;
    });

    it("Should be reject contributions when the funding goal is met", async function () {
      await campaign.contribute({
        value: parseEther("10"),
      });

      await expect(
        campaign.connect(addr1).contribute({ value: parseEther("1") })
      ).to.be.revertedWith("Campaign closed, no more contributions accepted.");
    });

    it("Should emit a FundingComplete event", async function () {
      await expect(campaign.contribute({ value: parseEther("10") }))
        .to.emit(campaign, "FundingComplete")
        .withArgs(testData.title, parseEther("10"));
    });

    it("Should allow raising past the funding goal", async function () {
      const value = parseEther("100");
      await campaign.contribute({ value });

      const active = await campaign.getStatus();

      const balance = await campaign.balance();

      expect(active).to.be.false;
      expect(balance).to.equal(value);
    });

    it("Should be able to withdraw when funding goal is met", async function () {
      const value = parseEther("15");
      await campaign.connect(addr1).contribute({ value });

      await expect(await campaign["withdraw()"]).to.changeEtherBalance(
        owner,
        value
      );
    });

    it("Should block withdraw from everyone except the owner", async function () {
      const value = parseEther("15");
      await campaign.connect(addr1).contribute({ value });

      await expect(campaign.connect(addr1)['withdraw()']()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    // it("Should be able to withdraw part of the balance", async function () {
    //   const withdrawalAmmount = parseEther("5");
    //   const contributionAmmount = parseEther("15")

    //   await campaign.contribute({ value: contributionAmmount });

    //   console.log("withdrawalAmmount", formatEther(withdrawalAmmount))
    //   console.log("contributionAmmount", formatEther(contributionAmmount))

    //   const startingBalance = await campaign.balance()
    //   console.log("startingBalance", formatEther(startingBalance))

    //   await campaign['withdraw(uint256)'](withdrawalAmmount)

    //   const secondBalance= await campaign.balance()
    //   console.log("secondBalance", formatEther(secondBalance))

    //   // await expect(
    //   //   await campaign['withdraw(uint256)'](withdrawalAmmount)
    //   // ).to.changeEtherBalance(owner, withdrawalAmmount);

    //   // const diff = contributionAmmount.sub(withdrawalAmmount)
    //   // await expect(campaign.balance()).to.equal(diff);
    // });

    // it('Should return the balance if the withdrawal amount exceeds the balance', async function () {
    //   const contributionAmmount = parseEther("15")
    //   const withdrawalAmmount = parseEther("20");

    //   await campaign.contribute({ value: contributionAmmount })

    //   await expect(
    //     await campaign['withdraw(uint256)'](withdrawalAmmount)
    //   ).to.changeEtherBalance(owner, contributionAmmount);

    // });
  });

  // describe('Failed', function () {
  //   it('Should set status to failed if funding goal is not met in 30 days', async function () {

  //   });

  // it('Should emit a FundingFailed event', async function () {

  // });

  //   it('Should block contributions after the end date has passed', async function () {

  //   });

  //   it('Should refund contributions if the funding goal is not met', async function () {

  //   });
  // });
});
