// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from './common/constants';

export interface IDeployParams {
  name: string;
  symbol: string;
  tokenurisuffix: string;
  maxsupply: number;
  globalwalletlimit: number;
  cosigner?: string;
  timestampexpiryseconds: number;
  increasesupply?: boolean;
  useoperatorfilterer?: boolean;
  isProxy?: boolean;
}

export const deploy = async (
  args: IDeployParams,
  hre: HardhatRuntimeEnvironment,
) => {
  // Compile again in case we have a coverage build (binary too large to deploy)
  await hre.run('compile');

  let contractName: string = args.increasesupply
    ? ContractDetails.ERC721MIncreasableSupply.name
    : ContractDetails.ERC721M.name;

  if (args.useoperatorfilterer) {
    contractName = ContractDetails.ERC721MOperatorFilterer.name;
  }

  console.log(
    `Going to deploy ${contractName} with params`,
    JSON.stringify(args, null, 2),
  );
  const ERC721M = await hre.ethers.getContractFactory(contractName);

  const params = [
    args.name,
    args.symbol,
    args.tokenurisuffix,
    hre.ethers.BigNumber.from(args.maxsupply),
    hre.ethers.BigNumber.from(args.globalwalletlimit),
    args.cosigner ?? hre.ethers.constants.AddressZero,
    args.timestampexpiryseconds ?? 300,
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
 
  let erc721M;
  let implementationAddress = undefined;
  if (args.isProxy) { 
    erc721M = await hre.upgrades.deployProxy(ERC721M, [...params], { initializer: 'initialize', kind: 'transparent' }); 
    implementationAddress = (erc721M.deployTransaction as any).creates;   
  }
  else { 
    erc721M = await ERC721M.deploy(...params);
  }

  await erc721M.deployed();

  console.log(`${contractName} deployed to:`, erc721M.address);
  
  return implementationAddress ? implementationAddress : erc721M.address;
};
