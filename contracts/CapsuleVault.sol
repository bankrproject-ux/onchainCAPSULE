// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICapsuleNFT is IERC721 {
    function burn(uint256 tokenId) external;
}

contract CapsuleVault is Ownable, ReentrancyGuard {
    using Address for address payable;

    IERC20 public immutable capsuleToken;
    ICapsuleNFT public immutable capsuleNFT;

    // 17,000 CAPS per burned NFT
    uint256 public constant REWARD_PER_NFT = 17_000 ether;

    // Internal claim fee
    uint256 public constant CLAIM_FEE = 0.00006 ether;

    uint256 public totalClaimedNFTs;
    uint256 public totalClaimedTokens;

    mapping(uint256 => bool) public claimed;

    event CapsuleClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward
    );

    event FeesWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    constructor(
        address capsuleNFT_,
        address capsuleToken_
    ) Ownable(msg.sender) {
        require(
            capsuleNFT_ != address(0),
            "Invalid NFT address"
        );

        require(
            capsuleToken_ != address(0),
            "Invalid token address"
        );

        capsuleNFT = ICapsuleNFT(capsuleNFT_);
        capsuleToken = IERC20(capsuleToken_);
    }

    function claim(uint256 tokenId)
        external
        payable
        nonReentrant
    {
        require(
            msg.value == CLAIM_FEE,
            "Incorrect claim fee"
        );

        require(
            !claimed[tokenId],
            "Capsule already claimed"
        );

        require(
            capsuleNFT.ownerOf(tokenId) == msg.sender,
            "Not Capsule owner"
        );

        require(
            capsuleToken.balanceOf(address(this)) >= REWARD_PER_NFT,
            "Insufficient reward balance"
        );

        // Mark as claimed before external calls.
        claimed[tokenId] = true;

        // Transfer Capsule from user to Vault.
        // User must approve the Vault first.
        capsuleNFT.transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        // Vault now owns the NFT, so it can burn it.
        capsuleNFT.burn(tokenId);

        // Send 17,000 CAPS to the user.
        bool success = capsuleToken.transfer(
            msg.sender,
            REWARD_PER_NFT
        );

        require(
            success,
            "Token transfer failed"
        );

        totalClaimedNFTs += 1;
        totalClaimedTokens += REWARD_PER_NFT;

        emit CapsuleClaimed(
            msg.sender,
            tokenId,
            REWARD_PER_NFT
        );
    }

    function withdrawFees(
        address payable recipient
    ) external onlyOwner {
        require(
            recipient != address(0),
            "Invalid recipient"
        );

        uint256 balance = address(this).balance;

        require(
            balance > 0,
            "No fees available"
        );

        recipient.sendValue(balance);

        emit FeesWithdrawn(
            recipient,
            balance
        );
    }

    function remainingRewards()
        external
        view
        returns (uint256)
    {
        return capsuleToken.balanceOf(
            address(this)
        );
    }

    function isClaimed(
        uint256 tokenId
    ) external view returns (bool) {
        return claimed[tokenId];
    }
}
