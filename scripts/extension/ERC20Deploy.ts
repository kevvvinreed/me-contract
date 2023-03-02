import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from '../common/constants';

export interface IERC20DeployParams {
  name: string;
  symbol: string; 
  maxsupply: number; 
}

export const erc20Deploy = async (
  args: IERC20DeployParams,
  hre: HardhatRuntimeEnvironment,
) => {
  // Compile again in case we have a coverage build (binary too large to deploy)
  await hre.run('compile');

  let contractName: string = ContractDetails.ERC20K.name 

  console.log(
    `Going to deploy ${contractName} with params`,
    JSON.stringify(args, null, 2),
  );
  const ERC20K = await hre.ethers.getContractFactory(contractName);

  const params = [
    args.name,
    args.symbol,
    args.maxsupply
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

  const erc20K = await ERC20K.deploy(...params);

  await erc20K.deployed();

  console.log(`${contractName} deployed to:`, erc20K.address);
  
  return erc20K.address;
};
