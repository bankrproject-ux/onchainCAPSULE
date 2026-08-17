const hre = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("=================================");
    console.log(" onchainCAPSULE TOKEN ALLOCATION");
    console.log("=================================\n");

    const [deployer] = await hre.ethers.getSigners();

    console.log("Deployer:", deployer.address);

    const tokenAddress = process.env.CAPSULE_TOKEN_ADDRESS;
    const vaultAddress = process.env.CAPSULE_VAULT_ADDRESS;
    const liquidityAddress = process.env.LIQUIDITY_WALLET;

    if (!tokenAddress) {
        throw new Error("CAPSULE_TOKEN_ADDRESS is missing");
    }

    if (!vaultAddress) {
        throw new Error("CAPSULE_VAULT_ADDRESS is missing");
    }

    if (!liquidityAddress) {
        throw new Error("LIQUIDITY_WALLET is missing");
    }

    const token = await hre.ethers.getContractAt(
        "CapsuleToken",
        tokenAddress
    );

    const vaultAllocation = hre.ethers.parseEther(
        "85000000"
    );

    const liquidityAllocation = hre.ethers.parseEther(
        "15000000"
    );

    console.log("\nAllocation:");
    console.log(
        "Vault:",
        hre.ethers.formatEther(vaultAllocation),
        "CAPS"
    );

    console.log(
        "Liquidity:",
        hre.ethers.formatEther(liquidityAllocation),
        "CAPS"
    );

    const totalAllocation =
        vaultAllocation + liquidityAllocation;

    const deployerBalance = await token.balanceOf(
        deployer.address
    );

    console.log(
        "\nDeployer CAPS:",
        hre.ethers.formatEther(deployerBalance)
    );

    if (deployerBalance < totalAllocation) {
        throw new Error(
            "Deployer does not have enough CAPS"
        );
    }

    console.log("\nSending 85M CAPS to Vault...");

    const vaultTx = await token.transferTo(
        vaultAddress,
        vaultAllocation
    );

    console.log(
        "Vault transaction:",
        vaultTx.hash
    );

    await vaultTx.wait();

    console.log(
        "85M CAPS successfully sent to Vault."
    );

    console.log("\nSending 15M CAPS to liquidity wallet...");

    const liquidityTx = await token.transferTo(
        liquidityAddress,
        liquidityAllocation
    );

    console.log(
        "Liquidity transaction:",
        liquidityTx.hash
    );

    await liquidityTx.wait();

    console.log(
        "15M CAPS successfully sent to liquidity wallet."
    );

    const finalBalance = await token.balanceOf(
        deployer.address
    );

    console.log("\n=================================");
    console.log(" ALLOCATION COMPLETE");
    console.log("=================================");

    console.log(
        "Vault:",
        hre.ethers.formatEther(
            await token.balanceOf(vaultAddress)
        ),
        "CAPS"
    );

    console.log(
        "Liquidity:",
        hre.ethers.formatEther(
            await token.balanceOf(liquidityAddress)
        ),
        "CAPS"
    );

    console.log(
        "Remaining deployer:",
        hre.ethers.formatEther(finalBalance),
        "CAPS"
    );
}

main().catch((error) => {
    console.error("\nAllocation failed:");
    console.error(error);

    process.exitCode = 1;
});
