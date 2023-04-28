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
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { Network } from 'alchemy-sdk';
import { AbiItem } from 'web3-utils';
import {
  erc721msDeploy,
  IERC721MSDeployParams,
} from './extension/ERC721MSDeploy';
import { ContractDetails } from './common/constants';

const abiDecoder = require('abi-decoder');
const axios = require('axios');

const _deploy = async (
  isProxy: boolean = true,
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
    cosigner:
      process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
    timestampexpiryseconds: 300,
    isProxy: isProxy,
  };
  const contractAddress = await deploy(args, hre);

  const fetch_res = await fetch(
    `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=${process.env.STAGE_PASSWORD}`,
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

  try {
    console.log(`\x1b[33mVerifying ERC20 address (${contractAddress})\x1b[0m`);
    run('verify:verify', {
      address: contractAddress,
      constructorArguments: [
        args.name,
        args.symbol,
        args.tokenurisuffix,
        hre.ethers.BigNumber.from(args.maxsupply),
        hre.ethers.BigNumber.from(args.globalwalletlimit),
        args.cosigner ?? hre.ethers.constants.AddressZero,
        args.timestampexpiryseconds ?? 300,
      ],
    });
  } catch (error) {
    console.log(
      `\x1b[31mFailed to verify ERC20 address (${contractAddress})\x1b[0m`,
    );
  }

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
    | 'stakeDeploy'
    | '2Deploy'
    | 'proxyDeploy'
    | 'initImplementation'
    | 'upgradeImplementation'
    | 'verifyImplementation',
) {
  switch (opt) {
    case 'deploy': {
      const contractAddress = await _deploy();

      return;
    }
    case 'setStages': {
      const fetch_res = await fetch(
        `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=${process.env.STAGE_PASSWORD}`,
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
    case '2Deploy': {
      const erc20Args: IERC20DeployParams = {
        name: 'ERC20 Test',
        symbol: 'ET',
        maxsupply: 1000000,
      };

      const erc20Address = await erc20Deploy(erc20Args, hre);

      const erc721Args: IERC721MSDeployParams = {
        name: 'KSHTest',
        symbol: 'KSHT',
        tokenurisuffix: '.json',
        maxsupply: 1000,
        globalwalletlimit: 1000,
        timestampexpiryseconds: 300,
        cosigner:
          process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
        erc20Address: erc20Address,
        rewardAmount: 1000,
        rewardInterval: 60,
      };
      const erc721msAddress = await erc721msDeploy(erc721Args, hre);

      const fetch_res = await fetch(
        `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=${process.env.STAGE_PASSWORD}`,
      );
      const fetch_data = await fetch_res.json();
      const stages: StageConfig[] = fetch_data.data;

      const mintableArgs: ISetMintableParams = {
        contract: erc721msAddress,
        mintable: true,
      };

      await setMintable(mintableArgs, hre);

      const crossmintArgs: ISetCrossmintAddress = {
        crossmintaddress: '0xdAb1a1854214684acE522439684a145E62505233',
        contract: erc721msAddress,
      };
      await setCrossmintAddress(crossmintArgs, hre);

      const stageArgs: ISetStagesParams = {
        stages: stages,
        contract: erc721msAddress,
      };

      await setStages(stageArgs, hre);

      await erc20SetAdmin(
        {
          erc20Address,
          adminAddress: erc721msAddress,
          set: true,
        },
        hre,
      );

      try {
        console.log(
          `\x1b[33mVerifying ERC721MS address (${erc721msAddress})\x1b[0m`,
        );
        run('verify:verify', {
          address: erc721msAddress,
          constructorArguments: [
            erc721Args.name,
            erc721Args.symbol,
            erc721Args.tokenurisuffix,
            hre.ethers.BigNumber.from(erc721Args.maxsupply),
            hre.ethers.BigNumber.from(erc721Args.globalwalletlimit),
            erc721Args.cosigner ?? hre.ethers.constants.AddressZero,
            erc721Args.timestampexpiryseconds ?? 300,
            erc721Args.erc20Address,
            erc721Args.rewardInterval,
            erc721Args.rewardAmount,
          ],
        });
      } catch (error) {
        console.log(
          `\x1b[31mFailed to verify staking address (${erc721Args})\x1b[0m`,
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
    case 'proxyDeploy': {
      const erc721Args: IDeployParams = {
        name: 'KSHTest',
        symbol: 'KSHT',
        tokenurisuffix: '.json',
        maxsupply: 1000,
        globalwalletlimit: 1000,
        timestampexpiryseconds: 300,
        cosigner:
          process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
        isProxy: true,
      };

      const erc721Address = await deploy(erc721Args, hre); 
      return;
    }
    case 'initImplementation': {
      const args: IDeployParams = {
        name: 'KSHTest',
        symbol: 'KSHT',
        tokenurisuffix: '.json',
        maxsupply: 1000,
        globalwalletlimit: 1000,
        cosigner:
          process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
        timestampexpiryseconds: 300,
        isProxy: true,
      };

      const contractAddress = process.env.CONTRACT_ADDRESS || '';

      const fetch_res = await fetch(
        `https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=${process.env.STAGE_PASSWORD}`,
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
      return;
    }
    case 'upgradeImplementation': {
      const ERC721M = await hre.ethers.getContractFactory(
        ContractDetails.ERC721M.name,
      );
      await hre.upgrades.upgradeProxy(
        '0xb68D92A1E7A7C413Da6f9872319bE56C3efAc242',
        ERC721M,
        { kind: 'transparent' },
      );
      return;
    }
    case 'verifyImplementation': { 
      const erc721Args: IDeployParams = {
        name: 'KSHTest',
        symbol: 'KSHT',
        tokenurisuffix: '.json',
        maxsupply: 1000,
        globalwalletlimit: 1000,
        timestampexpiryseconds: 300,
        cosigner:
          process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
        isProxy: true,
      };

      //0xDbB525d985115F0a52C16d828bA2A86c96f115CF admin contract

      const erc721Address = '0x533f5d8195486Be578Ca6fabBc47aFDe63551764';

      console.log(`Implementation contract address: ${erc721Address}`);
      try {
        console.log(
          `\x1b[33mVerifying implementation contract (${erc721Address})\x1b[0m`,
        );
        hre.run('verify:verify', {
          address: erc721Address,
          name: 'ERC721M',
        });
      } catch (error) {
        console.log(
          `\x1b[31mFailed to verify implementation contract (${erc721Args})\x1b[0m`,
        );
      }
    }
  }
}

// index('proxyDeploy');
index('initImplementation');
// index('verifyImplementation');
// index('upgradeImplementation');
