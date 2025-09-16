import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import "./tasks/seed";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETH_RPC_URL = process.env.ETH_RPC_URL || "";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.4.26",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "byzantium",
          outputSelection: {
            "*": {
              "": ["ast"],
              "*": [
                "abi",
                "evm.bytecode",
                "evm.deployedBytecode",
                "evm.methodIdentifiers",
                "metadata"
              ]
            }
          }
        },
      },
    ],
  },
  networks: {
    hardhat: {
      // older bytecode/throw compatible
      hardfork: "byzantium",
    },
    sepolia: {
      url: ETH_RPC_URL || "",
      accounts,
    },
    holesky: {
      url: ETH_RPC_URL || "",
      accounts,
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
