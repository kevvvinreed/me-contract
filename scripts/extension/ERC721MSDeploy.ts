import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from '../common/constants';
 
export interface IERC721MSDeployParams {
    name: string;
    symbol: string;
    tokenurisuffix: string;
    maxsupply: number;
    globalwalletlimit: number;
    cosigner: string;
    timestampexpiryseconds: number; 
    erc20Address: string;
    rewardInterval: number;
    rewardAmount: number;
  }

export const erc721msDeploy = async (
  args: IERC721MSDeployParams,
  hre: HardhatRuntimeEnvironment,
) => {
  // Compile again in case we have a coverage build (binary too large to deploy)
  await hre.run('compile');

  let contractName: string = ContractDetails.ERC721MS.name 

  console.log(
    `Going to deploy ${contractName} with params`,
    JSON.stringify(args, null, 2),
  );
  const ERC721MS = await hre.ethers.getContractFactory(contractName);

  const params = [
    args.name,
    args.symbol,
    args.tokenurisuffix,
    hre.ethers.BigNumber.from(args.maxsupply),
    hre.ethers.BigNumber.from(args.globalwalletlimit),
    args.cosigner ?? hre.ethers.constants.AddressZero,
    args.timestampexpiryseconds ?? 300,
    args.erc20Address,
    args.rewardInterval,
    args.rewardAmount 
  ] as const;

  console.log(
    `Constructor params: `,
    JSON.stringify(
      params.map((param) => {
        if (hre.ethers.BigNumber.isBigNumber(param)) {
          return param.toString();
        }
        return param;
      }),
    ),
  );

  const erc721ms = await ERC721MS.deploy(...params);

  await erc721ms.deployed();

  console.log(`${contractName} deployed to:`, erc721ms.address);
  
  return erc721ms.address;
};
