const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Load contract artifacts
const ArbitrageBotArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../contracts/arbitragebot.sol/ArbitrageBot.json'), 'utf8'));
const MEVBoostWrapperArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../contracts/mevboostwrapper.sol/MEVBoostWrapper.json'), 'utf8'));

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function deployContract(artifact, ...args) {
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    console.log(`${artifact.contractName} deployed to: ${contract.address}`);
    return contract;
}

async function main() {
    // Deploy ArbitrageBot contract
    const mevBoostAddress = '0x4200000000000000000000000000000000000001'; // Example address
    const arbitrageBot = await deployContract(ArbitrageBotArtifact, mevBoostAddress);

    // Deploy MEVBoostWrapper contract
    const mevBoostWrapper = await deployContract(MEVBoostWrapperArtifact, mevBoostAddress);

    console.log('Deployment complete.');
}

main().catch(error => {
    console.error('Error deploying contracts:', error);
    process.exit(1);
});