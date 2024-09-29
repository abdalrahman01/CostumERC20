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


    constructor() ERC20("AbdToken", "ATKN") {
        _mint(msg.sender, 100 * 10 ** 18 );
        unsiswap = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    }


    function calculateFee(uint256 value, uint8 fee) internal pure returns (uint256) {
        return (value * fee) / 100; 
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        address owner = _msgSender();
        
        uint256 feeValue; 
        if (to == unsiswap) {
            // sell
            feeValue = calculateFee(value, sellingFee);
        } else {

            // transfer
            feeValue = calculateFee(value, transferFee);
        }

        value -= feeValue;
        _transfer(owner, owner, value);
        _transfer(owner, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        address owner = _msgSender();


        uint256 feeValue; 
        if (from == unsiswap) {

            // buy
            feeValue = calculateFee(value, buyingFee);
        } else if (to == unsiswap) {

            // sell
            feeValue = calculateFee(value, sellingFee);
        } else {

            feeValue = calculateFee(value, sellingFee);
        }


        value -= feeValue;
        _transfer(owner, owner, value);
        _transfer(from, to, value);
        return true;
    }
}