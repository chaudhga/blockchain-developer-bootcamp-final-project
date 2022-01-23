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
  const title = "Early Bird Offer";

  const firstCampaignID = 1;
  let instance;

  beforeEach(async () => {
    wormies = await Wormies.new();
    instance = await EarlyBirds.new(wormies.address);
    await wormies.transfer(instance.address, web3.utils.toWei('10000'));
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
      const _id = await instance.getCampaignID();

      const result = await instance.getCampaignDetails.call(_id);
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
      await instance.addCampaign("Test Register", 1, { from: alice });
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      const tx = await instance.register(result[1], { from: bob});
  
      let eventRegistration = false;
      let eventFull = false;

      if (tx.logs[1].event == "LogRegistration") {
        eventRegistration = true;
      }
      assert.equal(
        eventRegistration,
        true,
        'Event LogRegistration should be emitted after registration'
      )

      if (tx.logs[0].event == "LogCampaignFull") {
        eventFull = true;
      }
      assert.equal(
        eventFull,
        true,
        'Event LogCampaignFull should be emitted after campaign is full'
      )

      const resultAfterRegistration = await instance.getCampaignDetails.call(firstCampaignID);
      assert.equal(
        resultAfterRegistration[2].toString(10),
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
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});
      await catchRevert(instance.register(result[1], { from: carl}));
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
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});

      await instance.airdrop(firstCampaignID, { from: _owner });
      var bobBalanceAfter = await wormies.balanceOf.call(bob);

      chai_assert(bobBalanceBefore<bobBalanceAfter, "Balance should increase");
    });


    it("should not allow airdrop from someone other than owner", async () => {
      await instance.addCampaign(title, capacity, { from: alice });
      bobBalanceBefore = await wormies.balanceOf.call(bob);
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});

      await catchRevert(instance.airdrop(firstCampaignID, { from: bob }), "Only owner should be able to airdrop");
    })


    it("should allow host to airdrop (if DEMO)", async () => {
      await instance.addCampaign(title, capacity, { from: alice });

      bobBalanceBefore = await wormies.balanceOf.call(bob);
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});

      await instance.airdrop(firstCampaignID, { from: alice });
      var bobBalanceAfter = await wormies.balanceOf.call(bob);

      chai_assert(bobBalanceBefore<bobBalanceAfter, "Balance should increase");
    });

    it("should not allow host to airdrop if not DEMO", async () => {
      await instance.setDemo(false,{from:_owner});
      await instance.addCampaign(title, capacity, { from: alice });

      bobBalanceBefore = await wormies.balanceOf.call(bob);
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});

      await catchRevert(instance.airdrop(firstCampaignID, { from: alice }), "Only owner should be able to airdrop");
    });

    it("should allow owner to set any address to be set as admin (allowing airdrop)", async () => {
      await instance.addCampaign(title, capacity, { from: alice });

      bobBalanceBefore = await wormies.balanceOf.call(bob);
      const result = await instance.getCampaignDetails.call(firstCampaignID);
      await instance.register(result[1], { from: bob});

      await instance.setDemo(false,{from:_owner});
      await instance.setAdmin(carl, { from: _owner });
      await instance.airdrop(firstCampaignID, { from: carl });
      var bobBalanceAfter = await wormies.balanceOf.call(bob);

      chai_assert(bobBalanceBefore<bobBalanceAfter, "Balance should increase");
    });
  });
});
