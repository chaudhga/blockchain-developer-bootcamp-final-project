let BN = web3.utils.BN;
let Wormies = artifacts.require("Wormies");
let EarlyBirds = artifacts.require("EarlyBirds");
let { catchRevert } = require("./exceptionsHelpers.js");
var chai_assert = require('chai').assert
const { items: ItemStruct, isDefined, isPayable, isType } = require("./ast-helper");

contract("EarlyBirds", function (accounts) {
  const [_owner, alice, bob, carl] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";

  const capacity = "1";
  const title = "New Year's Special Early Bird Offer";

  const firstCampaignID = 1;

  let campaignCode;

  let instance;

  beforeEach(async () => {
    wormies = await Wormies.new();
    instance = await EarlyBirds.new(wormies.address);
  });

  describe("Variables", () => {
    it("should have an owner", async () => {
      assert.equal(typeof instance.owner, 'function', "the contract has no owner");
    });

    it("should have an campaignCount",  () => {
      assert.equal(typeof instance.campaignCount, 'function', "the contract has no campaignCount");
    });

    describe("enum State", () => {
      let enumState;
      before(() => {
        enumState = EarlyBirds.enums.State;
        assert(
          enumState,
          "The contract should define an Enum called State"
        );
      });

      it("should define `Open`", () => {
        assert(
          enumState.hasOwnProperty('Open'),
          "The enum does not have a `Open` value"
        );
      });

      it("should define `Full`", () => {
        assert(
          enumState.hasOwnProperty('Full'),
          "The enum does not have a `Full` value"
        );
      });

      it("should define `Closed", () => {
        assert(
          enumState.hasOwnProperty('Closed'),
          "The enum does not have a `Closed` value"
        );
      });

      it("should define `Airdropped", () => {
        assert(
          enumState.hasOwnProperty('Airdropped'),
          "The enum does not have a `Airdropped` value"
        );
      });
    })
  });

  describe("Use cases", () => {
    it("should add a campaign with the provided title and capacity", async () => {
      await instance.addCampaign(title, capacity, { from: alice });

      const result = await instance.getCampaignDetails.call(firstCampaignID);
      campaignCode = result[1];
      assert.equal(
        result[0],
        title,
        "the title of the last added campaign does not match the expected value",
      );
      assert.equal(
        result[3].toString(10),
        capacity,
        "the capacity of the last added campaign does not match the expected value",
      );
      assert.equal(
        result[2].toString(10),
        EarlyBirds.State.Open,
        'the state of the campaign should be "Open"',
      );
      assert.equal(
        result[4],
        alice,
        "the address adding the campaign should be listed as the host",
      );
    });

    it("should emit a LogCampaignOpened event when a campaign is added", async () => {
      let eventEmitted = false;
      const tx = await instance.addCampaign(title, capacity, { from: alice });

      if (tx.logs[0].event == "LogCampaignOpened") {
        eventEmitted = true;
      }

      assert.equal(
        eventEmitted,
        true,
        "adding a campaign should emit a Campaign Opened event",
      );

      chai_assert(campaignCode,"adding a campaign should generate campaign code");
    });

    it("should allow someone to register for a campaign and update state accordingly", async () => {
      await instance.addCampaign(title, capacity, { from: alice });
      await instance.register(campaignCode, { from: bob});

      const result = await instance.getCampaignDetails.call(firstCampaignID);

      assert.equal(
        result[2].toString(10),
        EarlyBirds.State.Full,
        'the state of the campaign should be "Full"',
      );
    });

    it("should not allow someone to register twice", async () => {
      await instance.addCampaign(title, 2, { from: alice });
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});
      await catchRevert(instance.register(result[1], { from: bob}));
    });

    it("should not allow someone to register once campaign is full", async () => {
      await instance.addCampaign(title, 1, { from: alice });
      await instance.register(campaignCode, { from: bob});
      await catchRevert(instance.register(campaignCode, { from: carl}));
    });

    it("should allow host to close campaign", async () => {
      await instance.addCampaign(title, 1, { from: alice });
      await instance.close(firstCampaignID, { from: alice});
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      assert.equal(
        result[2].toString(10),
        EarlyBirds.State.Closed,
        'the state of the campaign should be "Close"',
      );
    });

    it("should not allow someone who is not host to close campaign", async () => {
      await instance.addCampaign(title, 1, { from: alice });
      await catchRevert(instance.close(campaignCode, { from: carl}));
    });

    it("should allow owner to airdrop", async () => {
      await instance.addCampaign(title, capacity, { from: alice });

      bobBalanceBefore = await wormies.balanceOf.call(bob);
      await instance.register(campaignCode, { from: bob});

      await instance.airdrop(firstCampaignID, { from: _owner });

      var bobBalanceAfter = await wormies.balanceOf.call(bob);

      chai_assert(bobBalanceBefore<bobBalanceAfter, "Balance should increase");
    });

    it("should not allow airdrop from someone other than owner", async () => {
      await instance.addCampaign(title, capacity, { from: alice });
      bobBalanceBefore = await wormies.balanceOf.call(bob);
      await instance.register(campaignCode, { from: bob});
      let txt = web3.utils.hexToAscii(campaignCode);
      let hex = web3.utils.asciiToHex(txt);
      let num = web3.utils.hexToNumber(campaignCode);
      let ntox = web3.utils.hexToNumber(num);
      console.log("Code: "+campaignCode+" number:"+num+" Hex:"+hex);

      await catchRevert(instance.airdrop(firstCampaignID, { from: bob }), "Only owner should be able to airdrop");
    })
  });
});
