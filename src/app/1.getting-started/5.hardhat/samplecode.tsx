export const InitializedPackageJSON = `{
  "name": "hardhat-tutorial",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}`

export const AfterInstallDepsPackageJSON = `{
{
  "name": "hardhat-tutorial",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@nomicfoundation/hardhat-chai-matchers": "^2.0.8",
    "@nomicfoundation/hardhat-ethers": "^3.0.8",
    "@nomicfoundation/hardhat-ignition": "^0.15.7",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@openzeppelin/contracts": "^5.1.0",
    "@types/chai": "^5.0.1",
    "chai": "^4.4.1",
    "dayjs": "^1.11.13",
    "dotenv": "^16.4.5",
    "ethers": "^6.13.4",
    "hardhat": "^2.22.15",
    "solidity-coverage": "^0.8.13"
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}

`

export const AfterScriptPackageJSON = `{
{
  "name": "hardhat-tutorial",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@nomicfoundation/hardhat-chai-matchers": "^2.0.8",
    "@nomicfoundation/hardhat-ethers": "^3.0.8",
    "@nomicfoundation/hardhat-ignition": "^0.15.7",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@openzeppelin/contracts": "^5.1.0",
    "@types/chai": "^5.0.1",
    "chai": "^4.4.1",
    "dayjs": "^1.11.13",
    "dotenv": "^16.4.5",
    "ethers": "^6.13.4",
    "hardhat": "^2.22.15",
    "solidity-coverage": "^0.8.13"
  },
  "scripts": {
    "compile": "hardhat compile",
    "coverage": "hardhat coverage",
    "test": "hardhat test"
  }
}

`

export const SampleHardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import dotenv from "dotenv";

dotenv.config();

const { PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  networks: {
    gemini: {
      url: "https://rpc5.gemini.axiomesh.io",
      accounts: PRIVATE_KEY ? [process.env.PRIVATE_KEY!] : [],
    },
  },
};

export default config;`

export const SampleTsConfig = `
{
    "compilerOptions": {
      "target": "es2020",
      "module": "commonjs",
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "skipLibCheck": true,
      "resolveJsonModule": true
    }
  }`

export const SampleSolidityCode = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract HelloWorld {
    function helloWorld() public returns (string memory) {
        return "Hello, World!";
    }
}
`
