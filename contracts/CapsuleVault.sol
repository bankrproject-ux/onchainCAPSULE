// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CapsuleVault is Ownable, ReentrancyGuard {
    IERC20 public immutable capsuleToken;
    IERC721 public immutable capsuleNFT;

    uint256 public constant REWARD_PER_NFT = 17_000 ether;
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
        require(capsuleNFT_ != address(0), "Invalid NFT address");
        require(capsuleToken_ != address(0), "Invalid token address");

        capsuleNFT = IERC721(capsuleNFT_);
        capsuleToken = IERC20(capsuleToken_);
    }

    function claim(uint256 tokenId)
        external
        payable
        nonReentrant
    {
        require(msg.value == CLAIM_FEE, "Incorrect claim fee");
        require(!claimed[tokenId], "Capsule already claimed");

        require(
            capsuleNFT.ownerOf(tokenId) == msg.sender,
            "Not Capsule owner"
        );

        require(
            capsuleToken.balanceOf(address(this)) >= REWARD_PER_NFT,
            "Insufficient reward balance"
        );

        claimed[tokenId] = true;

        // User must approve this Vault for the NFT before calling claim().
        IERC721(address(capsuleNFT)).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        // Burn the Capsule.
        // This requires the Vault to be approved for the NFT.
        IERC721Burnable(address(capsuleNFT)).burn(tokenId);

        // Send the fixed reward to the user.
        bool success = capsuleToken.transfer(
            msg.sender,
            REWARD_PER_NFT
        );

        require(success, "Token transfer failed");

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
        require(recipient != address(0), "Invalid recipient");

        uint256 balance = address(this).balance;

        require(balance > 0, "No fees available");

        recipient.transfer(balance);

        emit FeesWithdrawn(recipient, balance);
    }

    function remainingRewards()
        external
        view
        returns (uint256)
    {
        return capsuleToken.balanceOf(address(this));
    }
}

interface IERC721Burnable is IERC721 {
    function burn(uint256 tokenId) external;
}
