// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
 
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../ERC721M.sol";
import "./ERC20K.sol";

contract StakingERC721ForERC20 is Ownable, ReentrancyGuard {  

    address ERC721Address;
    uint256 public totalStaked;
    
    uint256 rewardInterval;
    uint256 rewardAmount;
    ERC721M nft;
    ERC20K token;
    

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


    error NotOwnerOfToken(address owner);
    error TokenAlreadyStaked();
    error CannotSendNFTsDirectly();

    constructor(ERC20K erc20, ERC721M erc721, uint256 _rewardInterval, uint256 _rewardAmount) { 
        token = erc20;
        nft = erc721;
        rewardInterval = _rewardInterval;
        rewardAmount = _rewardAmount;
    }
    
    function setRewardInterval(uint256 _rewardInterval) external onlyOwner {
        rewardInterval = _rewardInterval;
    }

    function setRewardAmount(uint256 _rewardAmount) external onlyOwner {
        rewardAmount = _rewardAmount;
    }

    function setERC721Address(address _ERC721Address) external onlyOwner {
        ERC721Address = _ERC721Address;
    } 

    function stake(uint256[] calldata tokenIds) external {
        uint256 tokenId;
        for(uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            address owner = nft.ownerOf(i);
            
            if(owner != _msgSender()) { 
                revert NotOwnerOfToken(owner);
            }
            if(vault[tokenId].tokenId != 0) {
                revert TokenAlreadyStaked();
            }

            nft.transferFrom(_msgSender(), address(this), tokenId);
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
                revert NotOwnerOfToken(staked.owner);
            }
            uint256 lastClaimed = staked.claimTimestamp;
            earned += rewardAmount * (block.timestamp - lastClaimed) / rewardInterval;
            // Update the claimTimestamp
            vault[tokenId] = Stake({
                owner: staked.owner,
                tokenId: staked.tokenId,
                stakeTimestamp: staked.stakeTimestamp,
                claimTimestamp: uint48(block.timestamp)
            });
        }

        if (earned > 0) {
            token.airdrop(user, earned);
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
                revert NotOwnerOfToken(staked.owner);
            }

            delete vault[tokenId];
            emit NFTUnstaked(user, tokenId, block.timestamp);

            nft.transferFrom(address(this), user, tokenId);
        }
    }

    function onERC721Received(address, address from, uint256, bytes calldata) external pure returns(bytes4) {
        if(from != address(0x0)) {
            revert CannotSendNFTsDirectly();
        }
        return IERC721Receiver.onERC721Received.selector;
    } 
}