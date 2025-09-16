import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("CryptoPunksMarket");
  const contract = await Factory.deploy({ value: 0 });
  const receipt = await contract.deploymentTransaction()?.wait();

  console.log(`CryptoPunksMarket deployed at: ${await contract.getAddress()}`);
  if (receipt) {
    console.log(`Block: ${receipt.blockNumber} Tx: ${receipt.hash}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

