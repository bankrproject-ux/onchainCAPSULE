// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CapsuleToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 ether;

    constructor()
        ERC20("onchainCAPSULE", "CAPS")
        Ownable(msg.sender)
    {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function transferTo(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(
            recipient != address(0),
            "Invalid recipient"
        );

        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        _transfer(
            msg.sender,
            recipient,
            amount
        );
    }
}
