// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AbdToken is ERC20 {

    // address sender; 
    // address reciever; 
    address unsiswap;
    
    uint8 transferFee = 1; // 1 %
    uint8 buyingFee = 2; // 2 %
    uint8 sellingFee = 3; // 3 %
    address owner;

    constructor() ERC20("AbdToken", "ATKN") {
        owner = msg.sender;
        _mint(owner, 100 * 10 ** 18 );
        unsiswap = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a; // Uniswap V2 Router address
    }


    function calculateFee(uint256 value, uint8 fee) internal pure returns (uint256) {
        return (value * fee) / 100; 
    }

    function _update(address from, address to, uint256 value) internal override {
        uint256 feeValue = 0; 
        if (from == unsiswap) {
            // buy
            feeValue = calculateFee(value, buyingFee);
        } 
        else if (to == unsiswap) {
            // sell
            feeValue = calculateFee(value, sellingFee);
        }
        else {
            // transfer 
            feeValue = calculateFee(value, transferFee);
        }
        
        uint256 newValue = value - feeValue;
        
        super._update(from, to, newValue);        
        super._update(from, owner, feeValue);        
    }

   
}