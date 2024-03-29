// This module wraps up the constants which can be used by any script

export const ContractDetails = {
  ERC721MS: {name: "ERC721MS"}, // Modified version of ERC721M to include staking
  ERC721M: { name: 'ERC721M' }, // The contract of direct sales
  BucketAuction: { name: 'BucketAuction' }, // The contract of bucket auctions
  ERC721MIncreasableSupply: { name: 'ERC721MIncreasableSupply' }, // ERC721M with increasable supply
  ERC721MOperatorFilterer: { name: 'ERC721MOperatorFilterer' }, // ERC721M with operator filterer
  ERC20K: { name: 'ERC20K' },
  StakingContract: { name: 'StakingERC721ForERC20' },
  ProxyContract: { name: 'Proxy' }
} as const;
