import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentDreamsEscrow, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AgentDreams Integration Tests - Full Lifecycle", function () {
  let escrow: AgentDreamsEscrow;
  let usdc: MockUSDC;
  let owner: HardhatEthersSigner;
  let settler: HardhatEthersSigner;
  let requester: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let otherUser: HardhatEthersSigner;

  const PAYOUT = ethers.parseUnits("100", 18);

  beforeEach(async function () {
    [owner, settler, requester, worker, otherUser] = await ethers.getSigners();

    // Deploy Mock USDC
    const USDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await USDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy Escrow
    const EscrowFactory = await ethers.getContractFactory("AgentDreamsEscrow");
    escrow = await EscrowFactory.deploy(
      await usdc.getAddress(),
      settler.address,
      owner.address
    );
    await escrow.waitForDeployment();

    // Mint USDC to requester
    await usdc.mint(requester.address, ethers.parseUnits("10000", 18));
  });

  describe("Complete Task Lifecycle - Success Path", function () {
    it("Should complete full cycle: create → release → verify", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("integration-task-1"));
      const deadline = (await time.latest()) + 3600; // 1 hour from now
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("completed-work-hash"));

      console.log("\n  ──────────────────────────────────────");
      console.log("  📋 CREATING TASK");
      console.log("  ──────────────────────────────────────");

      // 1. Requester approves USDC
      await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
      const allowance = await usdc.allowance(requester.address, await escrow.getAddress());
      console.log("  ✅ Requester approved", ethers.formatUnits(allowance, 18), "USDC");

      // 2. Requester creates task
      const balanceBefore = await usdc.balanceOf(requester.address);
      await escrow.connect(requester).createTask(taskId, PAYOUT, deadline);
      const balanceAfter = await usdc.balanceOf(requester.address);

      console.log("  ✅ Task created - ID:", taskId);
      console.log("  💸 Requester balance:", ethers.formatUnits(balanceBefore, 18), "→", ethers.formatUnits(balanceAfter, 18), "USDC");
      console.log("  🔒 Escrow balance:", ethers.formatUnits(await usdc.balanceOf(await escrow.getAddress()), 18), "USDC");

      // Verify task state
      const task = await escrow.getTask(taskId);
      expect(task.status).to.equal(1); // FUNDED
      expect(task.payout).to.equal(PAYOUT);
      expect(task.requester).to.equal(requester.address);

      console.log("\n  ──────────────────────────────────────");
      console.log("  ⚙️  WORKER COMPLETES TASK");
      console.log("  ──────────────────────────────────────");

      // 3. Worker completes work (simulated off-chain)
      console.log("  🤖 Worker", worker.address.substring(0, 10) + "...", "submitted work");
      console.log("  📝 Result hash:", resultHash);

      console.log("\n  ──────────────────────────────────────");
      console.log("  ✅ SETTLER RELEASES PAYMENT");
      console.log("  ──────────────────────────────────────");

      // 4. Settler releases payment to worker
      const workerBalanceBefore = await usdc.balanceOf(worker.address);
      await escrow.connect(settler).release(taskId, worker.address, resultHash);
      const workerBalanceAfter = await usdc.balanceOf(worker.address);

      console.log("  💰 Worker received:", ethers.formatUnits(workerBalanceAfter.valueOf() - workerBalanceBefore.valueOf(), 18), "USDC");
      console.log("  ✅ Payment released successfully");

      // Verify final state
      const finalTask = await escrow.getTask(taskId);
      expect(finalTask.status).to.equal(2); // RELEASED
      expect(finalTask.worker).to.equal(worker.address);
      expect(finalTask.resultHash).to.equal(resultHash);
      expect(workerBalanceAfter).to.equal(PAYOUT);

      console.log("\n  ──────────────────────────────────────");
      console.log("  ✅ TASK COMPLETED SUCCESSFULLY");
      console.log("  ──────────────────────────────────────\n");
    });
  });

  describe("Complete Task Lifecycle - Refund Path", function () {
    it("Should handle settler-initiated refund", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("refund-task-1"));
      const deadline = (await time.latest()) + 3600;

      console.log("\n  ──────────────────────────────────────");
      console.log("  📋 CREATING TASK");
      console.log("  ──────────────────────────────────────");

      // Create task
      await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
      const balanceBefore = await usdc.balanceOf(requester.address);
      await escrow.connect(requester).createTask(taskId, PAYOUT, deadline);

      console.log("  ✅ Task created");
      console.log("  💸 Funds locked in escrow");

      console.log("\n  ──────────────────────────────────────");
      console.log("  ❌ TASK FAILED - INITIATING REFUND");
      console.log("  ──────────────────────────────────────");

      // Settler refunds
      await escrow.connect(settler).refund(taskId);
      const balanceAfter = await usdc.balanceOf(requester.address);

      console.log("  ✅ Refund processed by settler");
      console.log("  💰 Requester balance restored:", ethers.formatUnits(balanceAfter, 18), "USDC");

      // Verify
      expect(balanceAfter).to.equal(balanceBefore);
      const task = await escrow.getTask(taskId);
      expect(task.status).to.equal(3); // REFUNDED

      console.log("  ──────────────────────────────────────\n");
    });

    it("Should handle requester self-refund after deadline", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("timeout-task-1"));
      const deadline = (await time.latest()) + 3600;

      console.log("\n  ──────────────────────────────────────");
      console.log("  ⏰ TESTING DEADLINE-BASED REFUND");
      console.log("  ──────────────────────────────────────");

      // Create task
      await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
      const balanceBefore = await usdc.balanceOf(requester.address);
      await escrow.connect(requester).createTask(taskId, PAYOUT, deadline);

      console.log("  ✅ Task created with", Math.floor(3600 / 3600), "hour deadline");

      // Try to refund before deadline (should fail)
      await expect(
        escrow.connect(requester).refund(taskId)
      ).to.be.revertedWithCustomError(escrow, "DeadlineNotReached");

      console.log("  ❌ Refund blocked - deadline not reached");

      // Fast forward past deadline
      await time.increase(3601);
      console.log("  ⏩ Fast-forwarded past deadline");

      // Now requester can refund
      await escrow.connect(requester).refund(taskId);
      const balanceAfter = await usdc.balanceOf(requester.address);

      console.log("  ✅ Requester self-refund successful");
      console.log("  💰 Balance restored:", ethers.formatUnits(balanceAfter, 18), "USDC");

      expect(balanceAfter).to.equal(balanceBefore);
      console.log("  ──────────────────────────────────────\n");
    });
  });

  describe("Multiple Tasks Simulation", function () {
    it("Should handle multiple concurrent tasks", async function () {
      console.log("\n  ──────────────────────────────────────");
      console.log("  📊 TESTING MULTIPLE CONCURRENT TASKS");
      console.log("  ──────────────────────────────────────");

      const numTasks = 3;
      const taskIds: string[] = [];
      const deadline = (await time.latest()) + 7200;

      // Create multiple tasks
      for (let i = 0; i < numTasks; i++) {
        const taskId = ethers.keccak256(ethers.toUtf8Bytes(`multi-task-${i}`));
        taskIds.push(taskId);

        await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
        await escrow.connect(requester).createTask(taskId, PAYOUT, deadline);

        console.log(`  ✅ Task ${i + 1}/${numTasks} created - ID: ${taskId.substring(0, 10)}...`);
      }

      const escrowBalance = await usdc.balanceOf(await escrow.getAddress());
      console.log(`  🔒 Total locked in escrow: ${ethers.formatUnits(escrowBalance, 18)} USDC`);

      // Release first task
      await escrow.connect(settler).release(
        taskIds[0],
        worker.address,
        ethers.keccak256(ethers.toUtf8Bytes("result-0"))
      );
      console.log(`  ✅ Task 1 released to worker`);

      // Refund second task
      await escrow.connect(settler).refund(taskIds[1]);
      console.log(`  ✅ Task 2 refunded to requester`);

      // Third task remains funded
      const task3 = await escrow.getTask(taskIds[2]);
      expect(task3.status).to.equal(1); // Still FUNDED
      console.log(`  ⏳ Task 3 still in progress`);

      console.log("  ──────────────────────────────────────\n");
    });
  });

  describe("Admin Functions", function () {
    it("Should update settler and transfer ownership", async function () {
      console.log("\n  ──────────────────────────────────────");
      console.log("  ⚙️  TESTING ADMIN FUNCTIONS");
      console.log("  ──────────────────────────────────────");

      // Update settler
      const newSettler = otherUser.address;
      await escrow.connect(owner).setSettler(newSettler);
      expect(await escrow.settler()).to.equal(newSettler);
      console.log("  ✅ Settler updated to:", newSettler.substring(0, 10) + "...");

      // Transfer ownership
      const newOwner = otherUser.address;
      await escrow.connect(owner).transferOwnership(newOwner);
      expect(await escrow.owner()).to.equal(newOwner);
      console.log("  ✅ Ownership transferred to:", newOwner.substring(0, 10) + "...");

      console.log("  ──────────────────────────────────────\n");
    });

    it("Should pause and unpause contract", async function () {
      console.log("\n  ──────────────────────────────────────");
      console.log("  ⏸️  TESTING PAUSE FUNCTIONALITY");
      console.log("  ──────────────────────────────────────");

      // Pause contract
      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.be.true;
      console.log("  ⏸️  Contract paused");

      // Try to create task while paused (should fail)
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("paused-task"));
      const deadline = (await time.latest()) + 3600;

      await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
      await expect(
        escrow.connect(requester).createTask(taskId, PAYOUT, deadline)
      ).to.be.revertedWithCustomError(escrow, "ContractPaused");

      console.log("  ❌ Task creation blocked (contract paused)");

      // Unpause
      await escrow.connect(owner).unpause();
      expect(await escrow.paused()).to.be.false;
      console.log("  ▶️  Contract unpaused");

      // Now can create task
      await escrow.connect(requester).createTask(taskId, PAYOUT, deadline);
      console.log("  ✅ Task creation successful");

      console.log("  ──────────────────────────────────────\n");
    });
  });
});
