// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AbdToken is ERC20 {

    // address sender; 
    // address reciever; 
    
    uint8 transferFee = 1; // 1 %
    uint8 buyingFee = 2; // 2 %
    uint8 sellingFee = 3; // 3 %

    address owner;  

    constructor() ERC20("AbdToken", "ATKN") {
        _mint(msg.sender, 1000);

        owner = msg.sender;
    }


    function send(address sender, address recipient, uint256 amount, uint8 fee) internal   {
        
        uint256 amountFee = (amount * fee) /100; 
        
        uint256 amountAfterFee = amount - amountFee;

        super._transfer(sender, owner, amountFee);
        super._transfer(sender, recipient, amountAfterFee);
    }

    function transfer(address sender, address recipient, uint256 amount) external  {
        send(sender, recipient, amount, transferFee);
    }
}