import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from '../common/constants';

export interface IErc20SetAdmin {
  erc20Address: string; 
  adminAddress: string;
  set: boolean;
}

export const erc20SetAdmin = async (
  args: IErc20SetAdmin,
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers } = hre;
  const ERC20K = await ethers.getContractFactory(ContractDetails.ERC20K.name);
  const contract = ERC20K.attach(args.erc20Address); 
  const tx = await contract.setAdmin(args.adminAddress, args.set);
   
  console.log(`Submitted tx ${tx.hash} to setOwner of contract ${args.erc20Address}`);

  await tx.wait();
 
};
