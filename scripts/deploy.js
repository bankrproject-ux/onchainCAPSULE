const hre = require("hardhat");
const readline = require("readline");

function ask(question, hidden = false) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        if (!hidden) {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.trim());
            });

            return;
        }

        process.stdout.write(question);

        const stdin = process.stdin;

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        let answer = "";

        const onData = (key) => {
            if (key === "\r" || key === "\n") {
                stdin.setRawMode(false);
                stdin.pause();
                stdin.removeListener("data", onData);
                rl.close();

                process.stdout.write("\n");
                resolve(answer.trim());

                return;
            }

            if (key === "\u0003") {
                process.exit();
            }

            if (key === "\u007f") {
                if (answer.length > 0) {
                    answer = answer.slice(0, -1);
                }

                return;
            }

            answer += key;
        };

        stdin.on("data", onData);
    });
}

async function main() {
    console.log("");
    console.log("========================================");
    console.log("       onchainCAPSULE DEPLOY");
    console.log("       Robinhood Chain Mainnet");
    console.log("       Chain ID: 4663");
    console.log("========================================");
    console.log("");

    const privateKey = await ask(
        "Private key: ",
        true
    );

    if (!privateKey) {
        throw new Error(
            "Private key cannot be empty."
        );
    }

    const liquidityWallet = await ask(
        "Liquidity wallet address: "
    );

    if (!hre.ethers.isAddress(liquidityWallet)) {
        throw new Error(
            "Invalid liquidity wallet address."
        );
    }

    const provider =
        hre.ethers.provider;

    const deployer =
        new hre.ethers.Wallet(
            privateKey,
            provider
        );

    const network =
        await provider.getNetwork();

    if (network.chainId !== 4663n) {
        throw new Error(
            `Wrong network. Expected 4663, got ${network.chainId}`
        );
    }

    console.log("");
    console.log(
        "Deployer:",
        deployer.address
    );

    console.log(
        "Liquidity:",
        liquidityWallet
    );

    const ethBalance =
        await provider.getBalance(
            deployer.address
        );

    console.log(
        "ETH balance:",
        hre.ethers.formatEther(
            ethBalance
        )
    );

    if (ethBalance === 0n) {
        throw new Error(
            "Deployer has no ETH for gas."
        );
    }

    console.log("");

    /*
     * CONFIRM
     */

    const confirmation = await ask(
        "Type DEPLOY to continue: "
    );

    if (confirmation !== "DEPLOY") {
        console.log(
            "\nDeployment cancelled."
        );

        return;
    }

    /*
     * IPFS ARTWORK
     */

    const imageURI =
        "ipfs://bafybeiassudszlwaxlnrxd7b76t6qbv4wttbbwpll3jestxkh4i5wemd6y";

    /*
     * TOKEN
     */

    console.log(
        "\n[1/3] Deploying CapsuleToken..."
    );

    const Token =
        await hre.ethers.getContractFactory(
            "CapsuleToken",
            deployer
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
     * NFT
     */

    console.log(
        "\n[2/3] Deploying CapsuleNFT..."
    );

    const NFT =
        await hre.ethers.getContractFactory(
            "CapsuleNFT",
            deployer
        );

    const nft =
        await NFT.deploy(
            imageURI
        );

    await nft.waitForDeployment();

    const nftAddress =
        await nft.getAddress();

    console.log(
        "CapsuleNFT:",
        nftAddress
    );

    /*
     * VAULT
     */

    console.log(
        "\n[3/3] Deploying CapsuleVault..."
    );

    const Vault =
        await hre.ethers.getContractFactory(
            "CapsuleVault",
            deployer
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
     * AUTHORIZE VAULT
     */

    console.log(
        "\nAuthorizing Vault..."
    );

    const setVaultTx =
        await nft.setVault(
            vaultAddress
        );

    console.log(
        "setVault:",
        setVaultTx.hash
    );

    await setVaultTx.wait();

    console.log(
        "Vault authorized."
    );

    /*
     * ALLOCATION
     */

    console.log(
        "\nSending 85,000,000 CAPS to Vault..."
    );

    const vaultTx =
        await token.transferTo(
            vaultAddress,
            hre.ethers.parseEther(
                "85000000"
            )
        );

    console.log(
        "Vault allocation:",
        vaultTx.hash
    );

    await vaultTx.wait();

    console.log(
        "85M CAPS sent."
    );

    console.log(
        "\nSending 15,000,000 CAPS to liquidity..."
    );

    const liquidityTx =
        await token.transferTo(
            liquidityWallet,
            hre.ethers.parseEther(
                "15000000"
            )
        );

    console.log(
        "Liquidity allocation:",
        liquidityTx.hash
    );

    await liquidityTx.wait();

    console.log(
        "15M CAPS sent."
    );

    /*
     * FINAL CHECK
     */

    const vaultBalance =
        await token.balanceOf(
            vaultAddress
        );

    const liquidityBalance =
        await token.balanceOf(
            liquidityWallet
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
        "Image:",
        imageURI
    );

    console.log(
        "========================================"
    );
}

main().catch((error) => {
    console.error("");
    console.error(
        "DEPLOYMENT FAILED"
    );
    console.error(error);
    process.exitCode = 1;
});
