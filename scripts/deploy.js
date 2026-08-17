const hre = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("");
    console.log("========================================");
    console.log("       onchainCAPSULE MAINNET");
    console.log("       Robinhood Chain");
    console.log("       Chain ID: 4663");
    console.log("========================================");
    console.log("");

    const [deployer] = await hre.ethers.getSigners();

    const network = await hre.ethers.provider.getNetwork();

    if (network.chainId !== 4663n) {
        throw new Error(
            `Wrong network. Expected 4663, got ${network.chainId}`
        );
    }

    console.log("Deployer:", deployer.address);

    const balance =
        await hre.ethers.provider.getBalance(
            deployer.address
        );

    console.log(
        "ETH balance:",
        hre.ethers.formatEther(balance)
    );

    if (balance === 0n) {
        throw new Error(
            "Deployer wallet has no ETH for gas."
        );
    }

    const liquidityWallet =
        process.env.LIQUIDITY_WALLET;

    if (!liquidityWallet) {
        throw new Error(
            "LIQUIDITY_WALLET is missing from .env"
        );
    }

    if (
        !hre.ethers.isAddress(
            liquidityWallet
        )
    ) {
        throw new Error(
            "LIQUIDITY_WALLET is not a valid address."
        );
    }

    console.log(
        "Liquidity wallet:",
        liquidityWallet
    );

    /*
     * ========================================
     * 1. DEPLOY CAPSULE TOKEN
     * ========================================
     */

    console.log("");
    console.log(
        "[1/3] Deploying CapsuleToken..."
    );

    const Token =
        await hre.ethers.getContractFactory(
            "CapsuleToken"
        );

    const token =
        await Token.deploy();

    await token.waitForDeployment();

    const tokenAddress =
        await token.getAddress();

    console.log(
        "CapsuleToken:",
        tokenAddress
    );

    /*
     * ========================================
     * 2. DEPLOY CAPSULE NFT
     * ========================================
     */

    console.log("");
    console.log(
        "[2/3] Deploying CapsuleNFT..."
    );

    const NFT =
        await hre.ethers.getContractFactory(
            "CapsuleNFT"
        );

    const nft =
        await NFT.deploy("");

    await nft.waitForDeployment();

    const nftAddress =
        await nft.getAddress();

    console.log(
        "CapsuleNFT:",
        nftAddress
    );

    /*
     * ========================================
     * 3. DEPLOY CAPSULE VAULT
     * ========================================
     */

    console.log("");
    console.log(
        "[3/3] Deploying CapsuleVault..."
    );

    const Vault =
        await hre.ethers.getContractFactory(
            "CapsuleVault"
        );

    const vault =
        await Vault.deploy(
            nftAddress,
            tokenAddress
        );

    await vault.waitForDeployment();

    const vaultAddress =
        await vault.getAddress();

    console.log(
        "CapsuleVault:",
        vaultAddress
    );

    /*
     * ========================================
     * 4. AUTHORIZE VAULT TO BURN NFT
     * ========================================
     */

    console.log("");
    console.log(
        "[4/5] Authorizing Vault..."
    );

    const setVaultTx =
        await nft.setVault(
            vaultAddress
        );

    console.log(
        "setVault tx:",
        setVaultTx.hash
    );

    await setVaultTx.wait();

    console.log(
        "Vault successfully authorized."
    );

    /*
     * ========================================
     * 5. TOKEN ALLOCATION
     * ========================================
     */

    console.log("");
    console.log(
        "[5/5] Allocating CAPS..."
    );

    const vaultAllocation =
        hre.ethers.parseEther(
            "85000000"
        );

    const liquidityAllocation =
        hre.ethers.parseEther(
            "15000000"
        );

    const totalSupply =
        await token.totalSupply();

    const deployerTokenBalance =
        await token.balanceOf(
            deployer.address
        );

    console.log("");
    console.log(
        "Total supply:",
        hre.ethers.formatEther(
            totalSupply
        ),
        "CAPS"
    );

    console.log(
        "Vault allocation:",
        hre.ethers.formatEther(
            vaultAllocation
        ),
        "CAPS"
    );

    console.log(
        "Liquidity allocation:",
        hre.ethers.formatEther(
            liquidityAllocation
        ),
        "CAPS"
    );

    const requiredAllocation =
        vaultAllocation +
        liquidityAllocation;

    if (
        deployerTokenBalance <
        requiredAllocation
    ) {
        throw new Error(
            "Deployer does not have enough CAPS."
        );
    }

    /*
     * Send 85M to Vault
     */

    console.log("");
    console.log(
        "Sending 85M CAPS to Vault..."
    );

    const vaultTx =
        await token.transferTo(
            vaultAddress,
            vaultAllocation
        );

    console.log(
        "Vault allocation tx:",
        vaultTx.hash
    );

    await vaultTx.wait();

    console.log(
        "85M CAPS sent to Vault."
    );

    /*
     * Send 15M to liquidity wallet
     */

    console.log("");
    console.log(
        "Sending 15M CAPS to liquidity wallet..."
    );

    const liquidityTx =
        await token.transferTo(
            liquidityWallet,
            liquidityAllocation
        );

    console.log(
        "Liquidity allocation tx:",
        liquidityTx.hash
    );

    await liquidityTx.wait();

    console.log(
        "15M CAPS sent to liquidity wallet."
    );

    /*
     * ========================================
     * FINAL VERIFICATION
     * ========================================
     */

    const vaultBalance =
        await token.balanceOf(
            vaultAddress
        );

    const liquidityBalance =
        await token.balanceOf(
            liquidityWallet
        );

    const remainingDeployerBalance =
        await token.balanceOf(
            deployer.address
        );

    console.log("");
    console.log(
        "========================================"
    );
    console.log(
        "       DEPLOYMENT COMPLETE"
    );
    console.log(
        "========================================"
    );

    console.log("");
    console.log(
        "CapsuleToken:",
        tokenAddress
    );

    console.log(
        "CapsuleNFT:",
        nftAddress
    );

    console.log(
        "CapsuleVault:",
        vaultAddress
    );

    console.log("");
    console.log(
        "Vault CAPS:",
        hre.ethers.formatEther(
            vaultBalance
        )
    );

    console.log(
        "Liquidity CAPS:",
        hre.ethers.formatEther(
            liquidityBalance
        )
    );

    console.log(
        "Deployer CAPS:",
        hre.ethers.formatEther(
            remainingDeployerBalance
        )
    );

    console.log("");
    console.log(
        "========================================"
    );
    console.log(
        "       SAVE THESE ADDRESSES"
    );
    console.log(
        "========================================"
    );

    console.log(
        `CAPSULE_TOKEN_ADDRESS=${tokenAddress}`
    );

    console.log(
        `CAPSULE_NFT_ADDRESS=${nftAddress}`
    );

    console.log(
        `CAPSULE_VAULT_ADDRESS=${vaultAddress}`
    );

    console.log(
        `LIQUIDITY_WALLET=${liquidityWallet}`
    );

    console.log("");
    console.log(
        "Deployment finished successfully."
    );
}

main().catch((error) => {
    console.error("");
    console.error(
        "DEPLOYMENT FAILED"
    );
    console.error("");
    console.error(error);

    process.exitCode = 1;
});
