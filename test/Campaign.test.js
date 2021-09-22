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
    fundingGoal: 10,
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
      expect(await campaign.fundingGoal()).to.equal(
        testData.fundingGoal
      );
    });
  });

  describe("Contribute", function () {
    it("Should not be able to contribute below the minimum (0.01 Eth)", async function () {
      await expect(
        campaign.contribute({ value: parseEther("0.001") })
      ).to.be.revertedWith("The minimum contribution is 0.01 ether");
    });

    it('Should take contributions and increase the balance', async function (done) {
      const value = parseEther("1")
      await campaign.contribute({ value })
      const newBalance = await campaign.balance()

      console.log(newBalance.eq(value))
      // expect(newBalance.eq(value)).to.be.true
      expect(newBalance).to.equal(value)
    });

  //   it('Should accept contributions from the creator/owner', function (done) {

  //   });

  //   it('Should accept more than contribution from the same address', function (done) {

  //   });

  // it('Should emit a Contribution event', function (done) {

  // });
  })

  // describe("Tiers", function () {
  //   it('Should return a Bronze tier NFT for base contributions', function (done) {

  //   });

  //   it('Should return a Silver NFT for contributions above 0.25 Eth', function (done) {

  //   });

  //   it('Should return a Gold tier NFT for contributions above 1 Eth', function (done) {

  //   });
  // })

  // describe('Campaign Management', function () {
  //   it('Should be cancelable by the owner', function (done) {

  //   });

  //   it('Should not be cancelable by not the owner', function (done) {

  //   });

  // it('Should emit a CampaignCancelled event', function (done) {

  // });
  // });

  // describe('Funding', function () {
  //   it('Should set status to funded when the funding goal is met', function (done) {

  //   });

  //   it('Should be reject contributions when the funding goal is met', function (done) {

  //   });

  // it('Should emit a FundingComplete event', function (done) {

  // });

  //   it('Should be able to withdraw when funding goal is met', function (done) {

  //   });

  //   it('Should block withdraw from everyone except the owner', function (done) {

  //   });

  //   it('Should be able to withdraw part of the balance', function (done) {

  //   });
  // });

  // describe('Failed', function () {
  //   it('Should set status to failed if funding goal is not met in 30 days', function (done) {

  //   });

  // it('Should emit a FundingFailed event', function (done) {

  // });

  //   it('Should block contributions after the end date has passed', function (done) {

  //   });

  //   it('Should refund contributions if the funding goal is not met', function (done) {

  //   });
  // });
});
