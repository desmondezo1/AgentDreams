import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying AgentMarketplace...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get USDC address (use MockUSDC for local/testnet)
  const usdcAddress = process.env.USDC_ADDRESS || await deployMockUSDC();
  console.log("USDC Address:", usdcAddress);

  // Fee recipient (platform wallet)
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  console.log("Fee Recipient:", feeRecipient, "\n");

  // Deploy AgentMarketplace
  const AgentMarketplace = await ethers.getContractFactory("AgentMarketplace");
  const marketplace = await AgentMarketplace.deploy(usdcAddress, feeRecipient);
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ AgentMarketplace deployed to:", marketplaceAddress);

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const platformFeeBps = await marketplace.platformFeeBps();

  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    marketplaceAddress,
    usdcAddress,
    feeRecipient,
    platformFeeBps: platformFeeBps.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📝 Next steps:");
  console.log("1. Update API .env with:");
  console.log(`   MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
  console.log(`   USDC_ADDRESS=${usdcAddress}`);
  console.log("\n2. Fund agent wallets with ~$1 of ETH on Base");
  console.log("\n3. Agents can start claiming tasks!");
}

async function deployMockUSDC(): Promise<string> {
  console.log("📦 Deploying MockUSDC for testing...");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Mint some USDC for testing
  const [deployer] = await ethers.getSigners();
  const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  await usdc.mint(deployer.address, mintAmount);
  console.log(`   Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer\n`);

  return usdcAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
