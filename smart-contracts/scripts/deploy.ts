import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting AgentDreams deployment...\n");

  // Get signers
  const [deployer, settler] = await ethers.getSigners();

  console.log("📋 Deployment Configuration:");
  console.log("  Deployer address:", deployer.address);
  console.log("  Settler address:", settler.address);
  console.log("  Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockUSDC
  console.log("📦 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("  ✅ MockUSDC deployed to:", usdcAddress);
  console.log("  💰 Initial supply:", ethers.formatUnits(await usdc.totalSupply(), 18), "mUSDC\n");

  // Deploy AgentDreamsEscrow
  console.log("📦 Deploying AgentDreamsEscrow...");
  const AgentDreamsEscrow = await ethers.getContractFactory("AgentDreamsEscrow");
  const escrow = await AgentDreamsEscrow.deploy(
    usdcAddress,
    settler.address,
    deployer.address
  );
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("  ✅ AgentDreamsEscrow deployed to:", escrowAddress);
  console.log("  👤 Owner:", await escrow.owner());
  console.log("  ⚖️  Settler:", await escrow.settler());
  console.log("  🪙  USDC Token:", await escrow.usdc(), "\n");

  // Mint some USDC to deployer for testing
  console.log("💸 Minting test USDC...");
  const mintAmount = ethers.parseUnits("10000", 18); // 10,000 USDC
  await usdc.mint(deployer.address, mintAmount);
  console.log("  ✅ Minted", ethers.formatUnits(mintAmount, 18), "mUSDC to deployer\n");

  // Summary
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("\n📝 Contract Addresses:");
  console.log("  MockUSDC:           ", usdcAddress);
  console.log("  AgentDreamsEscrow:  ", escrowAddress);
  console.log("\n👥 Key Addresses:");
  console.log("  Deployer/Owner:     ", deployer.address);
  console.log("  Settler:            ", settler.address);
  console.log("\n💡 Next Steps:");
  console.log("  1. Update frontend .env with contract addresses");
  console.log("  2. Approve USDC before creating tasks:");
  console.log("     await usdc.approve(escrowAddress, amount)");
  console.log("  3. Create tasks with:");
  console.log("     await escrow.createTask(taskId, payout, deadline)");
  console.log("\n");

  // Save deployment info to a file
  const deploymentInfo = {
    network: "localhost",
    contracts: {
      MockUSDC: usdcAddress,
      AgentDreamsEscrow: escrowAddress,
    },
    accounts: {
      deployer: deployer.address,
      settler: settler.address,
    },
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to deployments/localhost.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
