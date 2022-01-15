var Wormies = artifacts.require("./Wormies.sol");

module.exports = function(deployer) {
  deployer.deploy(Wormies);
};
