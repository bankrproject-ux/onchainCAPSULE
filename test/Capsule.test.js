const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("onchainCAPSULE", function () {
    let token;
    let nft;
    let vault;

    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy token
        const Token = await ethers.getContractFactory(
            "CapsuleToken"
        );

        token = await Token.deploy();
        await token.waitForDeployment();

        // Deploy NFT
        const NFT = await ethers.getContractFactory(
            "CapsuleNFT"
        );

        nft = await NFT.deploy("");
        await nft.waitForDeployment();

        // Deploy Vault
        const Vault = await ethers.getContractFactory(
            "CapsuleVault"
        );

        vault = await Vault.deploy(
            await nft.getAddress(),
            await token.getAddress()
        );

        await vault.waitForDeployment();

        // Send 85M CAPS to Vault
        await token.transferTo(
            await vault.getAddress(),
            ethers.parseEther("85000000")
        );
    });

    describe("Capsule NFT", function () {
        it("should allow free mint", async function () {
            await nft.connect(user1).mint(1);

            expect(
                await nft.ownerOf(1)
            ).to.equal(user1.address);

            expect(
                await nft.totalMinted()
            ).to.equal(1);
        });

        it("should allow maximum 2 NFTs per wallet", async function () {
            await nft.connect(user1).mint(2);

            expect(
                await nft.mintedPerWallet(user1.address)
            ).to.equal(2);

            await expect(
                nft.connect(user1).mint(1)
            ).to.be.revertedWith(
                "Wallet mint limit exceeded"
            );
        });

        it("should reject minting more than 2 at once", async function () {
            await expect(
                nft.connect(user1).mint(3)
            ).to.be.revertedWith(
                "Wallet mint limit exceeded"
            );
        });

        it("should enforce 5000 maximum supply", async function () {
            expect(
                await nft.MAX_SUPPLY()
            ).to.equal(5000);
        });
    });

    describe("Capsule Vault", function () {
        beforeEach(async function () {
            // User mints Capsule #1
            await nft.connect(user1).mint(1);

            // Approve Vault
            await nft.connect(user1).approve(
                await vault.getAddress(),
                1
            );
        });

        it("should claim exactly 17,000 CAPS", async function () {
            const beforeBalance =
                await token.balanceOf(user1.address);

            await vault.connect(user1).claim(1, {
                value: ethers.parseEther("0.00006")
            });

            const afterBalance =
                await token.balanceOf(user1.address);

            expect(
                afterBalance - beforeBalance
            ).to.equal(
                ethers.parseEther("17000")
            );
        });

        it("should burn the Capsule after claim", async function () {
            await vault.connect(user1).claim(1, {
                value: ethers.parseEther("0.00006")
            });

            await expect(
                nft.ownerOf(1)
            ).to.be.reverted;
        });

        it("should reject a second claim", async function () {
            await vault.connect(user1).claim(1, {
                value: ethers.parseEther("0.00006")
            });

            expect(
                await vault.claimed(1)
            ).to.equal(true);

            await expect(
                vault.connect(user1).claim(1, {
                    value: ethers.parseEther("0.00006")
                })
            ).to.be.revertedWith(
                "Capsule already claimed"
            );
        });

        it("should reject an incorrect claim fee", async function () {
            await expect(
                vault.connect(user1).claim(1, {
                    value: ethers.parseEther("0.00001")
                })
            ).to.be.revertedWith(
                "Incorrect claim fee"
            );
        });

        it("should reject claims from non-owner", async function () {
            await expect(
                vault.connect(user2).claim(1, {
                    value: ethers.parseEther("0.00006")
                })
            ).to.be.revertedWith(
                "Not Capsule owner"
            );
        });

        it("should track total claimed NFTs", async function () {
            await vault.connect(user1).claim(1, {
                value: ethers.parseEther("0.00006")
            });

            expect(
                await vault.totalClaimedNFTs()
            ).to.equal(1);
        });

        it("should track total claimed tokens", async function () {
            await vault.connect(user1).claim(1, {
                value: ethers.parseEther("0.00006")
            });

            expect(
                await vault.totalClaimedTokens()
            ).to.equal(
                ethers.parseEther("17000")
            );
        });
    });
});
