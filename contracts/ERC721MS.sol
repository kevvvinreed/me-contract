// SPDX-License-Identifier: MIT 

pragma solidity ^0.8.4;

import './ERC721M.sol';
import './ERC20/ERC20K.sol';
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Context.sol"; 

contract ERC721MS is ERC721M { 
    using ECDSA for bytes32; 

    uint[] _rewardMultipliers = [100, 150, 200, 250, 300, 350, 400, 450, 500];
    uint256 _multiplierStepInterval = 30 days;
    
    uint256 public totalStaked;

    bool private _erc20Permanent;
    ERC20K _token;
     
    struct Stake {
        uint24 tokenId;
        uint48 stakeTimestamp;
        uint48 lastClaimTimestamp;
        address owner;
    }

    mapping(uint256 => Stake) public vault;

    event NFTStaked(address owner, uint256 tokenId, uint256 value);
    event NFTUnstaked(address owner, uint256 tokenId, uint256 value);
    event Claimed(address owner, uint256 amount);
 
    error NotOwnerOfToken(string message, address owner);
    error TokenAlreadyStaked(string message);
    error CannotTransferWhileStaked(string message, uint256 tokenId);
    error DoesNotAcceptERC721Transfer(string message);
    error ERC20RewardsNotEnabled(string message);
    error NotAdminOnERC20Contract(string message);

    constructor(
        string memory collectionName,
        string memory collectionSymbol,
        string memory tokenURISuffix,
        uint256 maxMintableSupply,
        uint256 globalWalletLimit,
        address cosigner,
        uint64 timestampExpirySeconds
    ) ERC721M(collectionName, collectionSymbol, tokenURISuffix, maxMintableSupply, globalWalletLimit, cosigner, timestampExpirySeconds) {
         
    }

     
    // Set the ERC20 address for staking rewards and make it irreversible.
    // Prevent setting the permanent address before being authorized as an admin
    // on the ERC20 contract.
    function setERC20AddressPermanent(ERC20K erc20Contract) external onlyOwner {
        if(!erc20Contract.isAdmin(_msgSender())) {
            revert NotAdminOnERC20Contract("NotAdminOnERC20Contract");
        }
        _token = erc20Contract;
        _erc20Permanent = true;
    }

    // Get the address of the ERC20 token
    function getERC20Address() public view returns(address) {
        return address(_token);
    }
    
    // Stake tokenIds to start earning rewards
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
            emit NFTStaked(_msgSender(), tokenId, block.timestamp);

            vault[tokenId] = Stake({
                owner: _msgSender(),
                tokenId: uint24(tokenId),
                stakeTimestamp: uint48(block.timestamp),
                lastClaimTimestamp: uint48(block.timestamp)
            });
        }
    }

    // For internal reward calculation use
    function _calculateRecursiveRewards(uint48 startStake, uint48 lastClaimed, uint48 claimTime) internal view returns(uint256) { 
            // Calculate the daily multiplier
            uint256 totalStakeDuration = claimTime - startStake;
            uint multiplier;
            if (totalStakeDuration >= _multiplierStepInterval * _rewardMultipliers.length) { // Prevent index out of bounds error
                multiplier = _rewardMultipliers[_rewardMultipliers.length - 1]; 
            }
            else {
                multiplier = _rewardMultipliers[totalStakeDuration / _multiplierStepInterval]; 
            }

            // TODO: implement recursive logic here
            return multiplier * (lastClaimed / 1 days); // TODO: Solidity uses integer division, multiply and divide by 10^x to maintain significant digits
    }

    // Claim rewards for tokenId(s), if any of the tokenIds provided are not owned
    // by the sender throw an error. If the _unstake parameter is true, unstake
    // the tokens as well, if not just claim the rewards.
    // If the ERC20 contract has not been deployed/ connected revert
    function _claim(address user, uint256[] calldata tokenIds, bool _unstake) internal {

        if (!_erc20Permanent) {
            revert ERC20RewardsNotEnabled("ERC20RewardsNotEnabled");
        }

        uint256 tokenId;
        uint256 earned = 0;

        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vault[tokenId];
            if(staked.owner != _msgSender()) {
                revert NotOwnerOfToken("NotOwnerOfToken", staked.owner);
            }  
            uint48 claimTimestamp = uint48(block.timestamp); 
            earned += _calculateRecursiveRewards(staked.stakeTimestamp, staked.lastClaimTimestamp, claimTimestamp);
            vault[tokenId] = Stake({
                owner: staked.owner,
                tokenId: staked.tokenId,
                stakeTimestamp: staked.stakeTimestamp,
                lastClaimTimestamp: claimTimestamp
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

    // Remove all tokenIds from staking struct memory, throw an error if
    // the sender is not the owner.
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
        }
    } 
    
    // Unstake provided tokenId(s)
    function unstake(uint256[] calldata tokenIds) external {
        _claim(_msgSender(), tokenIds, true);
    }

    // Claim rewards for provided tokenId(s)
    function claim(uint256[] calldata tokenIds) external {
      _claim(_msgSender(), tokenIds, false);
    }

    // Returns a list of tokens owned by the entered owner address that are staked 
    function stakedTokensOfOwner(address owner) public view returns (uint256[] memory ownerTokens) {

        uint256 supply = totalSupply();
        uint256[] memory buf = new uint256[](supply);

        uint256 accumulator = 0;
        for(uint tokenId = 1; tokenId <= supply; tokenId++) {
            if (vault[tokenId].owner == owner) {
                buf[accumulator] = vault[tokenId].tokenId;
                accumulator +=1;
            }
        }

        uint256[] memory tokens = new uint256[](accumulator);
        for(uint i = 0; i < accumulator; i++) {
            tokens[i] = buf[i];
        }

        return tokens;
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