import { task } from "hardhat/config";

task("seed-all", "Seed initial owners so all punks are claimed")
  .addParam("contract", "Deployed CryptoPunksMarket address")
  .addParam("to", "Recipient address for assigned punks")
  .addOptionalParam("batch", "Batch size for setInitialOwners", "40")
  .addOptionalParam("start", "Start index (inclusive)", "0")
  .addOptionalParam("count", "How many to assign", "10000")
  .addOptionalParam("finalize", "Call allInitialOwnersAssigned at end (true/false)", "true")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { contract: contractAddress, to, batch, start, count, finalize } = args as {
      contract: string;
      to: string;
      batch: string;
      start: string;
      count: string;
      finalize: string;
    };

    if (!ethers.isAddress(contractAddress)) throw new Error("Invalid --contract address");
    if (!ethers.isAddress(to)) throw new Error("Invalid --to address");

    const contract = await (await ethers.getContractFactory("CryptoPunksMarket")).attach(contractAddress);
    const batchSize = Number(batch);
    const startIndex = Number(start);
    const total = Number(count);
    const doFinalize = finalize !== "false";

    const endExclusive = Math.min(10000, startIndex + total);
    console.log(`Seeding indices [${startIndex}, ${endExclusive}) with batch=${batchSize} to ${to}`);

    for (let i = startIndex; i < endExclusive; i += batchSize) {
      const batchEnd = Math.min(endExclusive, i + batchSize);
      const n = batchEnd - i;
      const addresses = Array(n).fill(to);
      const indices = Array.from({ length: n }, (_, k) => i + k);
      const tx = await contract.setInitialOwners(addresses, indices);
      const rc = await tx.wait();
      console.log(`Assigned ${n} punks [${i}..${batchEnd - 1}] tx=${rc!.hash}`);
    }

    if (doFinalize) {
      const tx = await contract.allInitialOwnersAssigned();
      const rc = await tx.wait();
      console.log(`Finalized allInitialOwnersAssigned tx=${rc!.hash}`);
    } else {
      console.log("Skipped finalization (use --finalize false to keep skipping)");
    }

    const remaining = await contract.punksRemainingToAssign();
    console.log(`punksRemainingToAssign=${remaining}`);
  });
