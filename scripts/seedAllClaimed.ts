import { ethers } from "hardhat";

type SeedArgs = {
  address: string; // target owner for all punks
  batchSize: number;
  start: number;
  count: number;
  finalize: boolean;
  contract: string; // deployed contract address
};

function parseArgs(): SeedArgs {
  const argv = process.argv.slice(2);
  const get = (key: string, def?: string) => {
    const idx = argv.indexOf(`--${key}`);
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    return def;
  };
  const address = get("to") || process.env.SEED_TO_ADDRESS || "";
  const contract = get("contract") || process.env.CONTRACT_ADDRESS || "";
  const batchSize = Number(get("batch", process.env.BATCH_SIZE || "40"));
  const start = Number(get("start", "0"));
  const count = Number(get("count", "10000"));
  const finalize = (get("finalize") || process.env.FINALIZE || "true") !== "false";
  if (!ethers.isAddress(address)) throw new Error("--to <address> is required and must be a valid address");
  if (!ethers.isAddress(contract)) throw new Error("--contract <address> is required and must be a valid address");
  return { address, batchSize, start, count, finalize, contract };
}

async function main() {
  const { address, batchSize, start, count, finalize, contract: contractAddress } = parseArgs();
  const contract = await ethers.getContractAt("CryptoPunksMarket", contractAddress);

  const endExclusive = Math.min(10000, start + count);
  console.log(`Seeding initial owners to ${address} for indices [${start}, ${endExclusive}) in batches of ${batchSize}`);

  for (let i = start; i < endExclusive; i += batchSize) {
    const batchEnd = Math.min(endExclusive, i + batchSize);
    const n = batchEnd - i;
    const addresses = Array(n).fill(address);
    const indices = Array.from({ length: n }, (_, k) => i + k);

    const tx = await contract.setInitialOwners(addresses, indices);
    const receipt = await tx.wait();
    console.log(`Assigned ${n} punks [${i}..${batchEnd - 1}] in tx ${receipt!.hash}`);
  }

  if (finalize) {
    const tx = await contract.allInitialOwnersAssigned();
    const receipt = await tx.wait();
    console.log(`Finalized allInitialOwnersAssigned in tx ${receipt!.hash}`);
  } else {
    console.log("Skipped finalizing allInitialOwnersAssigned (use --finalize false to keep skipping)");
  }

  const remaining = await contract.punksRemainingToAssign();
  console.log(`punksRemainingToAssign: ${remaining}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

