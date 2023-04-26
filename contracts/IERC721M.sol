//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/extensions/IERC721AQueryableUpgradeable.sol";

interface IERC721M is IERC721AQueryableUpgradeable {
    error CannotIncreaseMaxMintableSupply(string msg);
    error CannotUpdatePermanentBaseURI(string msg);
    error CosignerNotSet(string msg);
    error CrossmintAddressNotSet(string msg);
    error CrossmintOnly(string msg);
    error GlobalWalletLimitOverflow(string msg);
    error InsufficientStageTimeGap(string msg);
    error InvalidCosignSignature(string msg);
    error InvalidProof(string msg);
    error InvalidStage(string msg);
    error InvalidStageArgsLength(string msg);
    error InvalidStartAndEndTimestamp(string msg);
    error NoSupplyLeft(string msg);
    error NotEnoughValue(string msg);
    error NotMintable(string msg);
    error Mintable(string msg);
    error StageSupplyExceeded(string msg);
    error TimestampExpired(string msg);
    error WalletGlobalLimitExceeded(string msg);
    error WalletStageLimitExceeded(string msg);
    error WithdrawFailed(string msg);  

    struct MintStageInfo {
        uint80 price;
        uint32 walletLimit; // 0 for unlimited
        bytes32 merkleRoot; // 0x0 for no presale enforced
        uint24 maxStageSupply; // 0 for unlimited
        uint64 startTimeUnixSeconds;
        uint64 endTimeUnixSeconds;
    }

    event UpdateStage(
        uint256 stage,
        uint80 price,
        uint32 walletLimit,
        bytes32 merkleRoot,
        uint24 maxStageSupply,
        uint64 startTimeUnixSeconds,
        uint64 endTimeUnixSeconds
    );

    // event Test(address addr);
    event SetCosigner(address cosigner);
    event SetCrossmintAddress(address crossmintAddress);
    event SetMintable(bool mintable);
    event SetMaxMintableSupply(uint256 maxMintableSupply);
    event SetGlobalWalletLimit(uint256 globalWalletLimit);
    event SetActiveStage(uint256 activeStage);
    event SetBaseURI(string baseURI);
    event SetTimestampExpirySeconds(uint64 expiry);
    event PermanentBaseURI(string baseURI);
    event Withdraw(uint256 value);

    function getCosigner() external view returns (address);

    function getCrossmintAddress() external view returns (address);

    function getNumberStages() external view returns (uint256);

    function getGlobalWalletLimit() external view returns (uint256);

    function getTimestampExpirySeconds() external view returns (uint64);

    function getMaxMintableSupply() external view returns (uint256);

    function getMintable() external view returns (bool);

    function totalMintedByAddress(address a) external view returns (uint256);

    function getTokenURISuffix() external view returns (string memory);

    function getStageInfo(uint256 index)
        external
        view
        returns (
            MintStageInfo memory,
            uint32,
            uint256
        );

    function getActiveStageFromTimestamp(uint64 timestamp)
        external
        view
        returns (uint256);

    function assertValidCosign(
        address minter,
        uint32 qty,
        uint64 timestamp,
        bytes memory signature
    ) external view;
}
