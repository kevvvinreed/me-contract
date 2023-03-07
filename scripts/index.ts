import { deploy, IDeployParams } from './deploy';
import { IMintParams, mint } from './mint';
import { setStages, ISetStagesParams, StageConfig } from './setStages';
import { ISetMintableParams, setMintable } from './setMintable';
import { ISetBaseURIParams, setBaseURI } from './setBaseURI';
import {
  ISetCrossmintAddress,
  setCrossmintAddress,
} from './setCrossmintAddress';
import { IERC20DeployParams, erc20Deploy } from './extension/ERC20Deploy';
import { IStakingContract, stakingDeploy } from './extension/StakingDeploy';
import { erc20SetAdmin } from './extension/ERC20SetAdmin';

import hre, { run } from 'hardhat';
import { ethers, utils } from 'ethers';

const abiDecoder = require('abi-decoder');
const axios = require('axios');

const _deploy = async (
  contractName: string = 'KSHTest',
  symbol: string = 'KSHT',
  maxsupply: number = 1000,
  globalwalletlimit: number = 1000,
): Promise<string> => {
  const args: IDeployParams = {
    name: contractName,
    symbol: symbol,
    tokenurisuffix: '.json',
    maxsupply: maxsupply,
    globalwalletlimit: globalwalletlimit,
    timestampexpiryseconds: 300,
    cosigner:
      process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
  };
  const contractAddress = await deploy(args, hre);

  const fetch_res = await fetch(
    `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=T2Fg2fEpTJq1phZz28UQRQNakchTjrvGLqgNvFAMnEwcnidAp5MrkxtkZPr5oa0hZKELDtdCMYGe2iaznyEiVsAzeaxV9QNvwxZ6`,
  );
  const fetch_data = await fetch_res.json();
  const stages: StageConfig[] = fetch_data.data;

  const mintableArgs: ISetMintableParams = {
    contract: contractAddress,
    mintable: true,
  };

  await setMintable(mintableArgs, hre);

  const crossmintArgs: ISetCrossmintAddress = {
    crossmintaddress: '0xdAb1a1854214684acE522439684a145E62505233',
    contract: contractAddress,
  };
  await setCrossmintAddress(crossmintArgs, hre);

  const stageArgs: ISetStagesParams = {
    stages: stages,
    contract: contractAddress,
  };

  await setStages(stageArgs, hre);

  return contractAddress;
};

async function index(
  opt:
    | 'deploy'
    | 'setStages'
    | 'mint'
    | 'setMintable'
    | 'setBaseURI'
    | 'setCrossmintAddress'
    | 'ERC20Deploy'
    | '3Deploy'
    | 'stakeDeploy',
) {
  switch (opt) {
    case 'deploy': {
      const contractAddress = await _deploy();
      return;
    }
    case 'setStages': {
      const fetch_res = await fetch(
        `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=T2Fg2fEpTJq1phZz28UQRQNakchTjrvGLqgNvFAMnEwcnidAp5MrkxtkZPr5oa0hZKELDtdCMYGe2iaznyEiVsAzeaxV9QNvwxZ6`,
      );
      const fetch_data = await fetch_res.json();
      const stages: StageConfig[] = fetch_data.data;

      const args: ISetStagesParams = {
        stages: stages,
        contract: process.env.CONTRACT_ADDRESS || '',
      };

      await setStages(args, hre);

      return;
    }
    case 'mint': {
      const args: IMintParams = {
        contract: process.env.CONTRACT_ADDRESS || '',
        minttime: Date.now(),
        quantity: '1',
      };

      await mint(args, hre);
      return;
    }
    case 'setMintable': {
      const args: ISetMintableParams = {
        contract: process.env.CONTRACT_ADDRESS || '',
        mintable: true,
      };

      await setMintable(args, hre);
      return;
    }
    case 'setBaseURI': {
      const args: ISetBaseURIParams = {
        uri: `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getNFTs?individual=true&tokenIds=`,
        contract: process.env.CONTRACT_ADDRESS || '',
      };
      await setBaseURI(args, hre);
      return;
    }
    case 'setCrossmintAddress': {
      const args: ISetCrossmintAddress = {
        crossmintaddress: '0xdAb1a1854214684acE522439684a145E62505233',
        contract: process.env.CONTRACT_ADDRESS || '',
      };
      await setCrossmintAddress(args, hre);
      return;
    }
    case 'ERC20Deploy': {
      const args: IERC20DeployParams = {
        name: 'ERC20 Test',
        symbol: 'ET',
        maxsupply: 1000000,
      };

      await erc20Deploy(args, hre);
    }
    case '3Deploy': {
      const NETWORK = 'goerli';

      const erc721Args: IDeployParams = {
        name: 'KSHTest',
        symbol: 'KSHT',
        tokenurisuffix: '.json',
        maxsupply: 1000,
        globalwalletlimit: 1000,
        timestampexpiryseconds: 300,
        cosigner:
          process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
      };
      const erc721Address: string = await _deploy();

      const erc20Args: IERC20DeployParams = {
        name: 'ERC20 Test',
        symbol: 'ET',
        maxsupply: 1000000,
      };
      const erc20Address: string = await erc20Deploy(erc20Args, hre);

      const stakingArgs: IStakingContract = {
        erc20Address,
        erc721Address,
        rewardInterval: 60,
        rewardAmount: 1000,
      };
      const stakingAddress = await stakingDeploy(stakingArgs, hre);

      await erc20SetAdmin(
        {
          erc20Address,
          adminAddress: stakingAddress,
          set: true,
        },
        hre,
      );

      console.log(
        `\x1b[32mSuccess!\x1b[0m\nERC20: \x1b[36m${erc20Address}\x1b[0m\nERC721: \x1b[36m${erc721Address}\x1b[0m\nStakingContract: \x1b[36m${stakingAddress}\x1b[0m\n`,
      );

      try {
        console.log(
          `\x1b[33mVerifying ERC721 address (${erc721Address})\x1b[0m`,
        );
        run('verify:verify', {
          address: erc721Address,
          constructorArguments: [
            erc721Args.name,
            erc721Args.symbol,
            erc721Args.tokenurisuffix,
            erc721Args.maxsupply,
            erc721Args.globalwalletlimit,
            erc721Args.cosigner,
            erc721Args.timestampexpiryseconds,
          ],
        });
      } catch (error) {
        console.log(
          `\x1b[31mFailed to verify ERC721 address (${erc721Address})\x1b[0m`,
        );
      }

      try {
        console.log(`\x1b[33mVerifying ERC20 address (${erc20Address})\x1b[0m`);
        run('verify:verify', {
          address: erc20Address,
          constructorArguments: [
            erc20Args.name,
            erc20Args.symbol,
            erc20Args.maxsupply,
          ],
        });
      } catch (error) {
        console.log(
          `\x1b[31mFailed to verify ERC20 address (${erc20Address})\x1b[0m`,
        );
      }

      try {
        console.log(
          `\x1b[33mVerifying Staking address (${stakingAddress})\x1b[0m`,
        );
        run('verify:verify', {
          address: stakingAddress,
          constructorArguments: [
            stakingArgs.erc20Address,
            stakingArgs.erc721Address,
            stakingArgs.rewardInterval,
            stakingArgs.rewardAmount,
          ],
        });
      } catch (error) {
        console.log(
          `\x1b[31mFailed to verify staking address (${stakingAddress})\x1b[0m`,
        );
      }

      return;
    }
    case 'stakeDeploy': {
      await stakingDeploy(
        {
          erc20Address: '0x4817aA6B82838B6859591Aa695679380Cc620f06',
          erc721Address: '0x42DA2D8E89889804A11A308C4e60C95Ed62F95b6',
          rewardInterval: 60,
          rewardAmount: 1000,
        },
        hre,
      );
      return;
    }
  }
}
const ABI = [
  {
    inputs: [
      {
        internalType: 'contract ERC20K',
        name: 'erc20',
        type: 'address',
      },
      {
        internalType: 'contract ERC721M',
        name: 'erc721',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_rewardInterval',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_rewardAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'CannotSendNFTsDirectly',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'NotOwnerOfToken',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TokenAlreadyStaked',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Claimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'NFTStaked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'NFTUnstaked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC721Received',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_ERC721Address',
        type: 'address',
      },
    ],
    name: 'setERC721Address',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_rewardAmount',
        type: 'uint256',
      },
    ],
    name: 'setRewardAmount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_rewardInterval',
        type: 'uint256',
      },
    ],
    name: 'setRewardInterval',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: 'tokenIds',
        type: 'uint256[]',
      },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'vault',
    outputs: [
      {
        internalType: 'uint24',
        name: 'tokenId',
        type: 'uint24',
      },
      {
        internalType: 'uint48',
        name: 'stakeTimestamp',
        type: 'uint48',
      },
      {
        internalType: 'uint48',
        name: 'claimTimestamp',
        type: 'uint48',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// index('3Deploy');

const URL = `https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=0xFE04eeaa0aE192269109c2C4B73aA529B6e6bA26&apikey=${process.env.ETHERSCAN_KEY}`;
const getAbi = async () => {
  const res = await axios.get(URL);
  return JSON.parse(res.data.result);
};

const x = async () => {
  // const bytecode: any = '0x59c896be';
  const bytecode =
    '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000c84f0491f5470e70000000000000000000000000000000000000000000000000153fbf585cb5b23000000000000000000000000000000000000000000000000095b04af7c968dc0';

  const abi = await getAbi();
  abiDecoder.addABI(abi);

  const decodedData = abiDecoder.decodeMethod(bytecode);
  console.log(`decoded data:`, decodedData);

  // const stakeArgs = {
  //   erc20Address: '0x4817aA6B82838B6859591Aa695679380Cc620f06',
  //   erc721Address: '0x42DA2D8E89889804A11A308C4e60C95Ed62F95b6',
  //   rewardInterval: 60,
  //   rewardAmount: 1000,
  // };
  // const stakeAddress = '0xFE04eeaa0aE192269109c2C4B73aA529B6e6bA26'
  // // const stakeAddress = await stakingDeploy(stakeArgs, hre);

  // try {
  //   console.log(`\x1b[33mVerifying Staking address (${stakeAddress})\x1b[0m`);
  //   run('verify:verify', {
  //     address: stakeAddress,
  //     constructorArguments: [
  //       stakeArgs.erc20Address,
  //       stakeArgs.erc721Address,
  //       stakeArgs.rewardInterval,
  //       stakeArgs.rewardAmount,
  //     ],
  //   });
  // } catch (error) {
  //   console.log(
  //     `\x1b[31mFailed to verify staking address (${stakeAddress})\x1b[0m`,
  //   );
  // }
};
x();
// ERC20: 0x4817aA6B82838B6859591Aa695679380Cc620f06
// ERC721: 0x42DA2D8E89889804A11A308C4e60C95Ed62F95b6
// StakingContract: 0x56A0206bE63647aE7C354567C60b22d4A7c7911E
