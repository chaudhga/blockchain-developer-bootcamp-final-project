var Wormies = artifacts.require("./Wormies.sol");
var EarlyBirds = artifacts.require("./EarlyBirds.sol");

module.exports = async function(deployer) {
  const wormies = await Wormies.deployed();
  await deployer.deploy(EarlyBirds, wormies.address);
  const earlyBirds = await EarlyBirds.deployed();
  await wormies.transfer(earlyBirds.address, web3.utils.toWei('1000000'));
};