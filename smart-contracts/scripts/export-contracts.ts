import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("📦 Exporting contract ABIs and addresses to frontend...\n");

  // Paths
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const deploymentsDir = path.join(__dirname, "../deployments");
  const webContractsDir = path.join(__dirname, "../../web/src/contracts");

  // Create contracts directory in web if it doesn't exist
  if (!fs.existsSync(webContractsDir)) {
    fs.mkdirSync(webContractsDir, { recursive: true });
  }

  // Read deployment info
  const deploymentFile = path.join(deploymentsDir, "localhost.json");
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));

  // Export MockUSDC ABI
  const usdcArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "MockUSDC.sol/MockUSDC.json"),
      "utf-8"
    )
  );

  // Export AgentDreamsEscrow ABI
  const escrowArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "AgentDreamsEscrow.sol/AgentDreamsEscrow.json"),
      "utf-8"
    )
  );

  // Create contract config file
  const contractConfig = {
    network: deployment.network,
    chainId: 31337, // Hardhat local network
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
      MockUSDC: {
        address: deployment.contracts.MockUSDC,
        abi: usdcArtifact.abi,
      },
      AgentDreamsEscrow: {
        address: deployment.contracts.AgentDreamsEscrow,
        abi: escrowArtifact.abi,
      },
    },
    accounts: deployment.accounts,
  };

  // Write to frontend
  const outputPath = path.join(webContractsDir, "contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(contractConfig, null, 2));

  console.log("✅ Contract ABIs exported to:", outputPath);
  console.log("\n📝 Exported contracts:");
  console.log("  - MockUSDC:", deployment.contracts.MockUSDC);
  console.log("  - AgentDreamsEscrow:", deployment.contracts.AgentDreamsEscrow);
  console.log("\n✅ Export complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
