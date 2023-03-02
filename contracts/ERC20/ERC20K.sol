// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ERC20K is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {  

    error MaxSupplyReached();
    error CannotIncreaseMaxSupply(); 

    constructor(string memory tokenName, string memory tokenSymbol, uint256 _maxSupply) ERC20(tokenName, tokenSymbol) { 
        _mint(address(this), _maxSupply * (10 ** decimals()));
    }
  
    // Internal mint function only to be used within constructor
    function _mint(address to, uint256 amount) internal virtual override(ERC20) { 
        super._mint(to, amount); 
    }  

    function airdrop(address to, uint256 amount) external onlyOwner {
        ERC20._transfer(address(this), to, amount);
    }
   
}