const hre = require("hardhat");

async function main() {
    console.log("=================================");
    console.log(" onchainCAPSULE MAINNET DEPLOY");
    console.log(" Robinhood Chain");
    console.log(" Chain ID: 4663");
    console.log("=================================\n");

    const [deployer] = await hre.ethers.getSigners();

    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(
        deployer.address
    );

    console.log(
        "Deployer ETH:",
        hre.ethers.formatEther(balance)
    );

    if (balance === 0n) {
        throw new Error(
            "Deployer wallet has no ETH for gas."
        );
    }

    /*
     * --------------------------------------------------
     * 1. DEPLOY CAPSULE TOKEN
     * --------------------------------------------------
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
     * --------------------------------------------------
     * 2. DEPLOY CAPSULE NFT
     * --------------------------------------------------
     *
     * IPFS base URI can be set later.
     * For initial deployment we use an empty URI.
     */

    console.log("\n[2/3] Deploying CapsuleNFT...");

    const NFT = await hre.ethers.getContractFactory(
        "CapsuleNFT"
    );

    const nft = await NFT.deploy("");

    await nft.waitForDeployment();

    const nftAddress = await nft.getAddress();

    console.log(
        "CapsuleNFT:",
        nftAddress
    );

    /*
     * --------------------------------------------------
     * 3. DEPLOY CAPSULE VAULT
     * --------------------------------------------------
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
     * --------------------------------------------------
     * DEPLOYMENT SUMMARY
     * --------------------------------------------------
     */

    console.log("\n=================================");
    console.log(" DEPLOYMENT COMPLETE");
    console.log("=================================");

    console.log(
        "\nCapsuleToken:",
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

    console.log("\n=================================");
    console.log(" IMPORTANT");
    console.log("=================================");

    console.log(
        "85,000,000 CAPS still remain in deployer wallet."
    );

    console.log(
        "15,000,000 CAPS are reserved for liquidity."
    );

    console.log(
        "DO NOT transfer anything until the addresses"
    );

    console.log(
        "above have been checked."
    );

    console.log("\nDeployment finished.");
}

main().catch((error) => {
    console.error("\nDeployment failed:");
    console.error(error);

    process.exitCode = 1;
});
