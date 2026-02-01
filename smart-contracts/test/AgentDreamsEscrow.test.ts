import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentDreamsEscrow, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentDreamsEscrow", function () {
  let escrow: AgentDreamsEscrow;
  let usdc: MockUSDC;
  let owner: HardhatEthersSigner;
  let settler: HardhatEthersSigner;
  let requester: HardhatEthersSigner;
  let worker: HardhatEthersSigner;

  const TASK_ID = ethers.keccak256(ethers.toUtf8Bytes("task-1"));
  const PAYOUT = ethers.parseUnits("100", 6); // 100 USDC (6 decimals for USDC usually, but default ERC20 is 18. Let's assume 18 for Mock unless we override decimals, but let's stick to default 18 for simplicity in Mock, or check Mock. Mock uses default ERC20 which is 18. Real USDC is 6. Wait, if I want to simulate USDC I should override decimals. But for logic testing 18 is fine as long as consistent. Let's use parseUnits(..., 18))
  // Wait, real USDC has 6 decimals. It's better to verify logic with 18 unless the contract has hardcoded 6 (it doesn't appear to).
  // Let's stick to 18 for the Mock for simplicity unless I update Mock.

  beforeEach(async function () {
    [owner, settler, requester, worker] = await ethers.getSigners();

    // Deploy Mock USDC
    const USDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await USDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy Escrow
    const EscrowFactory = await ethers.getContractFactory("AgentDreamsEscrow");
    escrow = await EscrowFactory.deploy(await usdc.getAddress(), settler.address, owner.address);
    await escrow.waitForDeployment();

    // Mint USDC to requester
    await usdc.mint(requester.address, ethers.parseUnits("1000", 18));
  });

  it("Should create a task and lock funds", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Approve escrow
    await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);

    // Create Task
    await expect(escrow.connect(requester).createTask(TASK_ID, PAYOUT, deadline))
      .to.emit(escrow, "TaskCreated")
      .withArgs(TASK_ID, requester.address, PAYOUT, deadline);

    // Check balance
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(PAYOUT);
    
    // Check task state
    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(1); // FUNDED
    expect(task.payout).to.equal(PAYOUT);
  });

  it("Should release funds to worker when authorized by settler", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("result"));

    await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
    await escrow.connect(requester).createTask(TASK_ID, PAYOUT, deadline);

    // Release
    await expect(escrow.connect(settler).release(TASK_ID, worker.address, resultHash))
      .to.emit(escrow, "TaskReleased")
      .withArgs(TASK_ID, worker.address, PAYOUT, resultHash);

    // Check worker balance
    expect(await usdc.balanceOf(worker.address)).to.equal(PAYOUT);
    
    // Check task state
    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(2); // RELEASED
  });

  it("Should allow refund by settler", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await usdc.connect(requester).approve(await escrow.getAddress(), PAYOUT);
    await escrow.connect(requester).createTask(TASK_ID, PAYOUT, deadline);

    // Refund by settler
    await expect(escrow.connect(settler).refund(TASK_ID))
      .to.emit(escrow, "TaskRefunded")
      .withArgs(TASK_ID, requester.address, PAYOUT);

    // Check requester balance (Initial 1000 - 100 sent + 100 refunded = 1000)
    expect(await usdc.balanceOf(requester.address)).to.equal(ethers.parseUnits("1000", 18));
  });
});
