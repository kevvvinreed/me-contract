import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractDetails } from '../common/constants';

export interface IStakingContract {
  erc20Address: string;
  erc721Address: string;
  rewardInterval: number;
  rewardAmount: number;
}

export const stakingDeploy = async (
  args: IStakingContract,
  hre: HardhatRuntimeEnvironment,
) => {
  // Compile again in case we have a coverage build (binary too large to deploy)
  await hre.run('compile');

  let contractName: string = ContractDetails.StakingContract.name;

  console.log(
    `Going to deploy ${contractName} with params`,
    JSON.stringify(args, null, 2),
  );
  const ERCStakingContract = await hre.ethers.getContractFactory(contractName);

  const params = [
    args.erc20Address,
    args.erc721Address,
    args.rewardInterval,
    args.rewardAmount,
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

  const ercStake = await ERCStakingContract.deploy(...params);

  await ercStake.deployed();

  console.log(`${contractName} deployed to:`, ercStake.address);

  return ercStake.address;
};
