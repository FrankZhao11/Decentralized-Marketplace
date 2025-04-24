// Initializes Web3, requests account access, and loads Marketplace contract.

import Web3 from 'web3';
import MarketplaceABI from '../../build/contracts/Marketplace.json';

const getWeb3 = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return web3;
  }
  if (window.web3) {
    return window.web3;
  }
  alert('Non-Ethereum browser detected. Please install MetaMask.');
  throw new Error('No Web3 provider found');
};

const getMarketplace = async () => {
  const web3 = await getWeb3();
  const networkId = await web3.eth.net.getId();
  const networkData = MarketplaceABI.networks[networkId];
  if (!networkData) {
    alert('Marketplace contract not deployed on this network.');
    throw new Error('Contract not found');
  }
  return new web3.eth.Contract(
    MarketplaceABI.abi,
    networkData.address
  );
};

export default getMarketplace;
