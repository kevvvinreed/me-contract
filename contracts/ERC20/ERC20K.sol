// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol"; 
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; 
import "@openzeppelin/contracts/utils/Context.sol";

contract ERC20K is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {   
    
    mapping(address => bool) private _isAdmin;

    error SenderIsNotAdmin();

    modifier onlyAdmin {
        if(!isAdmin(_msgSender())) {
            revert SenderIsNotAdmin();
        }
        _;
    }
  
    constructor(string memory tokenName, string memory tokenSymbol, uint256 _maxSupply) ERC20(tokenName, tokenSymbol) { 
        _isAdmin[_msgSender()] = true; 
        _mint(address(this), _maxSupply * (10 ** decimals())); 
    }
  
    // Internal mint function only to be used within constructor
    function _mint(address to, uint256 amount) internal virtual override(ERC20) { 
        super._mint(to, amount); 
    }

    
    function setAdmin(address _operator, bool _approved) external onlyOwner {
        _isAdmin[_operator] = _approved;
    }

    function isAdmin(address _operator) internal view returns(bool) {
        return _isAdmin[_operator];
    }  

    function airdrop(address to, uint256 amount) external onlyAdmin {
        ERC20._transfer(address(this), to, amount);
    }

    // function setERC721Address(address _ERC721Address) external onlyOwner {
    //     ERC721Address = _ERC721Address;
    // } 
   
}