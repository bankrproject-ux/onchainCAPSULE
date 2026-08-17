// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CapsuleNFT is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant MAX_PER_WALLET = 2;

    uint256 private _nextTokenId = 1;
    uint256 public totalMinted;

    string private _baseTokenURI;

    mapping(address => uint256) public mintedPerWallet;

    address public vault;

    error InvalidVault();
    error InvalidQuantity();
    error WalletMintLimitExceeded();
    error MaxSupplyExceeded();
    error NotVault();
    error TokenDoesNotExist();

    constructor(
        string memory baseTokenURI_
    )
        ERC721("onchainCAPSULE", "CAPSULE")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseTokenURI_;
    }

    function mint(uint256 quantity) external {
        if (quantity == 0) {
            revert InvalidQuantity();
        }

        if (
            mintedPerWallet[msg.sender] + quantity >
            MAX_PER_WALLET
        ) {
            revert WalletMintLimitExceeded();
        }

        if (
            totalMinted + quantity >
            MAX_SUPPLY
        ) {
            revert MaxSupplyExceeded();
        }

        mintedPerWallet[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;

            _safeMint(
                msg.sender,
                tokenId
            );

            _nextTokenId++;
            totalMinted++;
        }
    }

    function setVault(
        address vault_
    ) external onlyOwner {
        if (vault_ == address(0)) {
            revert InvalidVault();
        }

        vault = vault_;
    }

    function vaultBurn(
        uint256 tokenId
    ) external {
        if (msg.sender != vault) {
            revert NotVault();
        }

        if (!_ownerOf(tokenId).exists()) {
            revert TokenDoesNotExist();
        }

        _burn(tokenId);
    }

    function setBaseTokenURI(
        string calldata newBaseTokenURI
    ) external onlyOwner {
        _baseTokenURI = newBaseTokenURI;
    }

    function _baseURI()
        internal
        view
        override
        returns (string memory)
    {
        return _baseTokenURI;
    }

    function remainingSupply()
        external
        view
        returns (uint256)
    {
        return MAX_SUPPLY - totalMinted;
    }
}
