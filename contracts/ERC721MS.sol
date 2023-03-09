// SPDX-License-Identifier: MIT 

pragma solidity ^0.8.4;

import './ERC721M.sol';
import './ERC20/ERC20K.sol';
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract ERC721MS is ERC721M { 
    using ECDSA for bytes32;
   
    uint256 _rewardInterval;
    uint256 _rewardAmount;
    uint256 public totalStaked;
    ERC20K _token;
     
    struct Stake {
        uint24 tokenId;
        uint48 stakeTimestamp;
        uint48 claimTimestamp;
        address owner;
    }

    mapping(uint256 => Stake) public vault;

    event NFTStaked(address owner, uint256 tokenId, uint256 value);
    event NFTUnstaked(address owner, uint256 tokenId, uint256 value);
    event Claimed(address owner, uint256 amount);
 
    error NotOwnerOfToken(string message, address owner);
    error TokenAlreadyStaked(string message);
    error CannotTransferWhileStaked(string message, uint256 tokenId);

    constructor(
        string memory collectionName,
        string memory collectionSymbol,
        string memory tokenURISuffix,
        uint256 maxMintableSupply,
        uint256 globalWalletLimit,
        address cosigner,
        uint64 timestampExpirySeconds,
        ERC20K token,
        uint256 rewardInterval, 
        uint256 rewardAmount
    ) ERC721M(collectionName, collectionSymbol, tokenURISuffix, maxMintableSupply, globalWalletLimit, cosigner, timestampExpirySeconds) {
        _token = token;
        _rewardInterval = rewardInterval;
        _rewardAmount = rewardAmount;
    }

    
    function setRewardInterval(uint256 rewardInterval) external onlyOwner {
        _rewardInterval = rewardInterval;
    }

    function setRewardAmount(uint256 rewardAmount) external onlyOwner {
        _rewardAmount = rewardAmount;
    }

    
    function stake(uint256[] calldata tokenIds) external {
        uint256 tokenId;
        totalStaked += tokenIds.length;
        for(uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            address owner = ownerOf(tokenId);
            
            if(owner != _msgSender()) { 
                revert NotOwnerOfToken("NotOwnerOfToken", owner);
            }
            if(vault[tokenId].owner != address(0x0)) {
                revert TokenAlreadyStaked("TokenAlreadyStaked");
            } 
            // token transfers from ERC721 contract must be approved or else this will throw an error
            // nft.transferFrom(_msgSender(), address(this), tokenId); 
            emit NFTStaked(_msgSender(), tokenId, block.timestamp);

            vault[tokenId] = Stake({
                owner: _msgSender(),
                tokenId: uint24(tokenId),
                stakeTimestamp: uint48(block.timestamp),
                claimTimestamp: uint48(block.timestamp)
            });
        }
    }

    function _claim(address user, uint256[] calldata tokenIds, bool _unstake) internal {
        uint256 tokenId;
        uint256 earned = 0;

        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vault[tokenId];
            if(staked.owner != _msgSender()) {
                revert NotOwnerOfToken("NotOwnerOfToken", staked.owner);
            }
            uint256 lastClaimed = staked.claimTimestamp;
            earned += _rewardAmount * (block.timestamp - lastClaimed) / _rewardInterval;
            // Update the claimTimestamp
            vault[tokenId] = Stake({
                owner: staked.owner,
                tokenId: staked.tokenId,
                stakeTimestamp: staked.stakeTimestamp,
                claimTimestamp: uint48(block.timestamp)
            });
        }

        if (earned > 0) {
            _token.airdrop(user, earned);
        }

        if(_unstake) {
            _unstakeMany(user, tokenIds);
        }

        emit Claimed(user, earned);

    }

    function _unstakeMany(address user, uint256[] calldata tokenIds) internal {
        uint256 tokenId;
        totalStaked -= tokenIds.length;
        for(uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vault[tokenId];
            if(staked.owner != _msgSender()) {
                revert NotOwnerOfToken("NotOwnerOfToken", staked.owner);
            }

            delete vault[tokenId];
            emit NFTUnstaked(user, tokenId, block.timestamp);

            // nft.transferFrom(address(this), user, tokenId);
        }
    }

    function unstake(uint256[] calldata tokenIds) external {
        _claim(_msgSender(), tokenIds, true);
    }

    function claim(uint256[] calldata tokenIds) external {
      _claim(_msgSender(), tokenIds, false);
    }

    // Lock staked tokens
    function _beforeTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity) internal override {
        for(uint i = startTokenId; i < startTokenId + quantity; i++) { 
            if(vault[i].owner != address(0x0)) {
                revert CannotTransferWhileStaked("CannotTransferWhileStaked", i);
            } 
        }
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }
}