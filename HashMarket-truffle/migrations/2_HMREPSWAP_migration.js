const HMREPSWAP = artifacts.require("HMREPSWAP");

module.exports = function(deployer) {
  const initialSupply = 10000;
  const tokenName = "HASHMARKET REP";
  const tokenSymbol = "HMR";
  deployer.deploy(HMREPSWAP, initialSupply, tokenName, tokenSymbol);
};
