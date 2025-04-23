// migrations/1_deploy_contracts.js
// Deploys the Marketplace contract to the configured network.
//
// Usage:
//   truffle migrate --network <network_name>

const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying to network: ${network}`);
  await deployer.deploy(Marketplace);
  const instance = await Marketplace.deployed();
  console.log(`Marketplace deployed at: ${instance.address}`);
};
