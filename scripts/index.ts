// import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deploy, IDeployParams } from './deploy';
import { IMintParams, mint } from './mint';
import { setStages, ISetStagesParams, StageConfig } from './setStages';

async function index(opt: 'deploy' | 'setStages' | 'mint') {
  switch (opt) {
    case 'deploy': {
      const args: IDeployParams = {
        name: 'Test',
        symbol: 'TST',
        tokenurisuffix: '.json',
        maxsupply: '100',
        globalwalletlimit: '100',
      };
      await deploy(args, hre);

      return;
    }
    case 'setStages': {
      const day = 86400000;
      const now = Date.now();
      const stages: StageConfig[] = [
        {
          price: '0.001',
          startDate: now,
          endDate: now + day,
          whitelistPath: './config/whitelist.json',
          maxSupply: 100,
          walletLimit: 1,
        },
        {
          price: '0.001',
          startDate: now + day + 300000, // Minimum 5 minute separation
          endDate: now + day * 2,
          whitelistPath: './config/whitelist2.json',
          maxSupply: 100,
          walletLimit: 1,
        },
      ];

      const args: ISetStagesParams = {
        stages: JSON.stringify(stages),
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
  }
}

index('mint');
