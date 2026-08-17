const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("================================");
    console.log("onchainCAPSULE DEPLOYMENT");
    console.log("Robinhood Chain Mainnet");
    console.log("================================");

    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(
        deployer.address
    );

    console.log(
        "ETH Balance:",
        hre.ethers.formatEther(balance)
    );

    /*
     * IPFS ARTWORK
     */

    const imageURI =
        "ipfs://bafybeiassudszlwaxlnrxd7b76t6qbv4wttbbwpll3jestxkh4i5wemd6y";

    /*
     * DEPLOY TOKEN
     */

    console.log("\n[1/3] Deploying CapsuleToken...");

    const Token = await hre.ethers.getContractFactory(
        "CapsuleToken"
    );

    const token = await Token.deploy();

    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();

    console.log(
        "CapsuleToken:",
        tokenAddress
    );

    /*
     * DEPLOY NFT
     */

    console.log("\n[2/3] Deploying CapsuleNFT...");

    const NFT = await hre.ethers.getContractFactory(
        "CapsuleNFT"
    );

    const nft = await NFT.deploy(imageURI);

    await nft.waitForDeployment();

    const nftAddress = await nft.getAddress();

    console.log(
        "CapsuleNFT:",
        nftAddress
    );

    /*
     * DEPLOY VAULT
     */

    console.log("\n[3/3] Deploying CapsuleVault...");

    const Vault = await hre.ethers.getContractFactory(
        "CapsuleVault"
    );

    const vault = await Vault.deploy(
        nftAddress,
        tokenAddress
    );

    await vault.waitForDeployment();

    const vaultAddress = await vault.getAddress();

    console.log(
        "CapsuleVault:",
        vaultAddress
    );

    /*
     * AUTHORIZE VAULT
     */

    console.log("\nAuthorizing Vault...");

    const setVaultTx = await nft.setVault(
        vaultAddress
    );

    await setVaultTx.wait();

    console.log("Vault authorized.");

    /*
     * TOKEN ALLOCATION
     */

    const rewardAllocation =
        hre.ethers.parseEther("85000000");

    const liquidityAllocation =
        hre.ethers.parseEther("15000000");

    const liquidityWallet =
        process.env.LIQUIDITY_WALLET;

    if (!liquidityWallet) {
        throw new Error(
            "LIQUIDITY_WALLET is missing from .env"
        );
    }

    console.log(
        "\nSending 85M CAPS to Vault..."
    );

    const vaultTx = await token.transferTo(
        vaultAddress,
        rewardAllocation
    );

    await vaultTx.wait();

    console.log("85M CAPS sent to Vault.");

    console.log(
        "\nSending 15M CAPS to liquidity wallet..."
    );

    const liquidityTx = await token.transferTo(
        liquidityWallet,
        liquidityAllocation
    );

    await liquidityTx.wait();

    console.log(
        "15M CAPS sent to liquidity wallet."
    );

    /*
     * FINAL
     */

    console.log("\n================================");
    console.log("DEPLOYMENT COMPLETE");
    console.log("================================");

    console.log(
        "Token:",
        tokenAddress
    );

    console.log(
        "NFT:",
        nftAddress
    );

    console.log(
        "Vault:",
        vaultAddress
    );

    console.log(
        "Image:",
        imageURI
    );

    console.log(
        "Reward Pool:",
        "85,000,000 CAPS"
    );

    console.log(
        "Liquidity:",
        "15,000,000 CAPS"
    );

    console.log("================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
