import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from '../common/constants';

export interface IProxyDeploy {
  logicAddress: string;
  adminAddress: string;
  data: string;
}

export const proxyDeploy = async (
  args: IProxyDeploy,
  hre: HardhatRuntimeEnvironment,
) => {
  // Compile again in case we have a coverage build (binary too large to deploy)
  await hre.run('compile');

  let contractName: string = ContractDetails.ProxyContract.name;

  console.log(
    `Going to deploy ${contractName} with params`,
    JSON.stringify(args, null, 2),
  );
  // const ProxyContract = await hre.ethers.getContractFactory(contractName); 
  const ERC721MContract = await hre.ethers.getContractFactory(ContractDetails.ERC721M.name);

  const params = [
    args.logicAddress,
    args.adminAddress,
    args.data,  
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

  // const proxyContract = await ProxyContract.deploy(...params);
  const contract = await hre.upgrades.deployProxy(ERC721MContract, params);
  await contract.deployed();

  // proxyContract
  console.log(`${contractName} deployed to:`, contract.address);

  return contract.address;
};
