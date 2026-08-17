// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CapsuleNFT is ERC721, ERC721Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant MAX_PER_WALLET = 2;

    uint256 private _nextTokenId = 1;
    uint256 public totalMinted;

    string private _baseTokenURI;

    mapping(address => uint256) public mintedPerWallet;

    constructor(
        string memory baseTokenURI_
    ) ERC721("onchainCAPSULE", "CAPSULE") Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI_;
    }

    function mint(uint256 quantity) external {
        require(quantity > 0, "Quantity must be greater than 0");

        require(
            mintedPerWallet[msg.sender] + quantity <= MAX_PER_WALLET,
            "Wallet mint limit exceeded"
        );

        require(
            totalMinted + quantity <= MAX_SUPPLY,
            "Max supply exceeded"
        );

        mintedPerWallet[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;

            _safeMint(msg.sender, tokenId);

            _nextTokenId++;
            totalMinted++;
        }
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

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
}
