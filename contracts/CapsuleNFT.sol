// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract CapsuleNFT is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant MAX_PER_WALLET = 2;

    uint256 private _nextTokenId = 1;
    uint256 public totalMinted;

    string public imageURI;
    address public vault;

    mapping(address => uint256) public mintedPerWallet;

    error InvalidVault();
    error InvalidQuantity();
    error WalletMintLimitExceeded();
    error MaxSupplyExceeded();
    error NotVault();
    error TokenDoesNotExist();

    constructor(
        string memory imageURI_
    )
        ERC721("onchainCAPSULE", "CAPSULE")
        Ownable(msg.sender)
    {
        imageURI = imageURI_;
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

            _safeMint(msg.sender, tokenId);

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

        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist();
        }

        _burn(tokenId);
    }

    function setImageURI(
        string calldata newImageURI
    ) external onlyOwner {
        imageURI = newImageURI;
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override
        returns (string memory)
    {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist();
        }

        string memory json = string(
            abi.encodePacked(
                '{"name":"onchainCAPSULE #',
                _toString(tokenId),
                '","description":"A free-mint onchainCAPSULE NFT. Hold it, trade it, or burn it to unlock 17,000 CAPS.","image":"',
                imageURI,
                '","attributes":[]}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(json)
                )
            )
        );
    }

    function remainingSupply()
        external
        view
        returns (uint256)
    {
        return MAX_SUPPLY - totalMinted;
    }

    function _toString(
        uint256 value
    )
        internal
        pure
        returns (string memory)
    {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer =
            new bytes(digits);

        while (value != 0) {
            digits -= 1;

            buffer[digits] = bytes1(
                uint8(
                    48 + (value % 10)
                )
            );

            value /= 10;
        }

        return string(buffer);
    }
}
