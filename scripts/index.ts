// import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { keccak256 } from '@ethersproject/solidity';
import { Wallet } from '@ethersproject/wallet';
import { ContractDetails } from './common/constants';
import { deploy, IDeployParams } from './deploy';
import { IMintParams, mint } from './mint';
import { arrayify } from '@ethersproject/bytes';
import { setStages, ISetStagesParams, StageConfig } from './setStages';
import { ISetMintableParams, setMintable } from './setMintable';
import { ISetBaseURIParams, setBaseURI } from './setBaseURI';
import {ISetCrossmintAddress, setCrossmintAddress} from './setCrossmintAddress';

async function index(opt: 'deploy' | 'setStages' | 'mint' | 'setMintable' | 'setBaseURI' | 'setCrossmintAddress') {
  switch (opt) {
    case 'deploy': {
      const args: IDeployParams = {
        name: 'KushTest',
        symbol: 'KST',
        tokenurisuffix: '.json',
        maxsupply: '100',
        globalwalletlimit: '100',
        cosigner:
          process.env.COSIGNER || '0x2142F2AC9759B5E6f4165BBd40cCE5E7dbCDB49a',
      };
      const contractAddress = await deploy(args, hre);

      const fetch_res = await fetch(`https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=T2Fg2fEpTJq1phZz28UQRQNakchTjrvGLqgNvFAMnEwcnidAp5MrkxtkZPr5oa0hZKELDtdCMYGe2iaznyEiVsAzeaxV9QNvwxZ6`);
      const fetch_data = await fetch_res.json();
      const stages: StageConfig[] = fetch_data.data;

      console.log(`stages`, stages);
    

      const mintableArgs: ISetMintableParams = {
        contract: contractAddress,
        mintable: true,
      };

      await setMintable(mintableArgs, hre);

      
      const crossmintArgs: ISetCrossmintAddress = {
        crossmintaddress: '0xdAb1a1854214684acE522439684a145E62505233',
        contract: process.env.CONTRACT_ADDRESS || ''
      }
      await setCrossmintAddress(crossmintArgs, hre);

      const stageArgs: ISetStagesParams = {
        stages: stages,
        contract: contractAddress,
      };

      await setStages(stageArgs, hre);

      return;
    }
    case 'setStages': { 
      const fetch_res = await fetch(`https://us-central1-kush-kriminals-370421.cloudfunctions.net/getStageConfig?password=T2Fg2fEpTJq1phZz28UQRQNakchTjrvGLqgNvFAMnEwcnidAp5MrkxtkZPr5oa0hZKELDtdCMYGe2iaznyEiVsAzeaxV9QNvwxZ6`);
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
        contract: process.env.CONTRACT_ADDRESS || ''
      }
      await setBaseURI(args, hre);
      return;
    }
    case 'setCrossmintAddress': {

      const args: ISetCrossmintAddress = {
        crossmintaddress: '0xdAb1a1854214684acE522439684a145E62505233',
        contract: process.env.CONTRACT_ADDRESS || ''
      }
      await setCrossmintAddress(args, hre);
      return;
    }
  }
}

index('setStages');
