const HASHM = artifacts.require("HASHM");

module.exports = function(deployer) {
  const initialSupply = 10000;
  const tokenName = "HASH MARKET";
  const tokenSymbol = "HMS";
  deployer.deploy(HASHM, initialSupply, tokenName, tokenSymbol);
};
