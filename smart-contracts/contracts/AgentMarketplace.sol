// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentMarketplace
 * @notice Simplified marketplace where agents interact directly on-chain
 * @dev Agents pay their own gas for claim/submit, requesters fund tasks
 *
 * Flow:
 * 1. Requester creates task and funds with USDC (requester pays gas)
 * 2. Agent claims task (agent pays ~$0.01 gas)
 * 3. Agent submits result (agent pays ~$0.01 gas)
 * 4. Requester approves → USDC sent to agent automatically
 *
 * Benefits:
 * - Agents are autonomous (no API dependencies)
 * - Agents pay only ~$0.02 per task
 * - Platform costs $0 (no paymaster needed)
 * - Fully decentralized
 */
contract AgentMarketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum TaskStatus {
        NONE,        // Not created
        OPEN,        // Funded, ready for claiming
        CLAIMED,     // Agent has claimed
        SUBMITTED,   // Agent has submitted work
        APPROVED,    // Requester approved, agent paid
        REJECTED,    // Requester rejected
        REFUNDED     // Refunded to requester (deadline passed)
    }

    // ============ Structs ============

    struct Task {
        bytes32 taskId;
        address requester;
        address agent;
        uint256 payoutUSDC;
        uint64 deadline;
        TaskStatus status;
        string specHash;      // IPFS hash or short spec
        bytes32 resultHash;   // Hash of submitted result
    }

    // ============ State Variables ============

    IERC20 public immutable usdc;
    address public owner;

    // Platform fee (e.g., 2% = 200)
    uint256 public platformFeeBps = 200; // 2%
    uint256 public constant MAX_FEE_BPS = 1000; // 10% max
    address public feeRecipient;

    mapping(bytes32 => Task) public tasks;

    // Agent stats (for reputation)
    mapping(address => uint256) public agentTasksCompleted;
    mapping(address => uint256) public agentTasksRejected;

    // ============ Events ============

    event TaskCreated(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 payoutUSDC,
        uint64 deadline,
        string specHash
    );

    event TaskClaimed(
        bytes32 indexed taskId,
        address indexed agent
    );

    event TaskSubmitted(
        bytes32 indexed taskId,
        address indexed agent,
        bytes32 resultHash
    );

    event TaskApproved(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 payout,
        uint256 platformFee
    );

    event TaskRejected(
        bytes32 indexed taskId,
        address indexed agent
    );

    event TaskRefunded(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 amount
    );

    // ============ Errors ============

    error Unauthorized();
    error InvalidTask();
    error TaskNotOpen();
    error TaskNotClaimed();
    error TaskNotSubmitted();
    error AlreadyClaimed();
    error DeadlineNotPassed();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidFee();

    // ============ Constructor ============

    constructor(address _usdc, address _feeRecipient) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_feeRecipient != address(0), "Invalid fee recipient");

        usdc = IERC20(_usdc);
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // ============ Main Functions ============

    /**
     * @notice Create and fund a new task
     * @param taskId Unique task identifier (generated off-chain)
     * @param payoutUSDC Amount of USDC to pay agent (includes platform fee)
     * @param deadline Unix timestamp deadline
     * @param specHash IPFS hash or short description of task requirements
     */
    function createTask(
        bytes32 taskId,
        uint256 payoutUSDC,
        uint64 deadline,
        string calldata specHash
    ) external nonReentrant {
        if (tasks[taskId].status != TaskStatus.NONE) revert InvalidTask();
        if (payoutUSDC == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        // Calculate total including platform fee
        uint256 platformFee = (payoutUSDC * platformFeeBps) / 10000;
        uint256 totalDeposit = payoutUSDC + platformFee;

        // Transfer USDC from requester
        usdc.safeTransferFrom(msg.sender, address(this), totalDeposit);

        // Create task
        tasks[taskId] = Task({
            taskId: taskId,
            requester: msg.sender,
            agent: address(0),
            payoutUSDC: payoutUSDC,
            deadline: deadline,
            status: TaskStatus.OPEN,
            specHash: specHash,
            resultHash: bytes32(0)
        });

        emit TaskCreated(taskId, msg.sender, payoutUSDC, deadline, specHash);
    }

    /**
     * @notice Claim a task (agent pays gas ~$0.01)
     * @param taskId The task to claim
     */
    function claimTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.OPEN) revert TaskNotOpen();
        if (task.deadline <= block.timestamp) revert DeadlineNotPassed();

        // Update task
        task.agent = msg.sender;
        task.status = TaskStatus.CLAIMED;

        emit TaskClaimed(taskId, msg.sender);
    }

    /**
     * @notice Submit work result (agent pays gas ~$0.01)
     * @param taskId The task being submitted
     * @param resultHash Hash of the work result (for verification)
     */
    function submitResult(
        bytes32 taskId,
        bytes32 resultHash
    ) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.CLAIMED) revert TaskNotClaimed();
        if (task.agent != msg.sender) revert Unauthorized();
        if (resultHash == bytes32(0)) revert InvalidTask();

        // Update task
        task.resultHash = resultHash;
        task.status = TaskStatus.SUBMITTED;

        emit TaskSubmitted(taskId, msg.sender, resultHash);
    }

    /**
     * @notice Approve submitted work and pay agent
     * @param taskId The task to approve
     */
    function approveTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.SUBMITTED) revert TaskNotSubmitted();
        if (task.requester != msg.sender) revert Unauthorized();

        // Calculate amounts
        uint256 platformFee = (task.payoutUSDC * platformFeeBps) / 10000;
        uint256 agentPayout = task.payoutUSDC;

        // Update status
        task.status = TaskStatus.APPROVED;

        // Update agent stats
        agentTasksCompleted[task.agent]++;

        // Transfer funds
        usdc.safeTransfer(task.agent, agentPayout);
        if (platformFee > 0) {
            usdc.safeTransfer(feeRecipient, platformFee);
        }

        emit TaskApproved(taskId, task.agent, agentPayout, platformFee);
    }

    /**
     * @notice Reject submitted work
     * @param taskId The task to reject
     */
    function rejectTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.SUBMITTED) revert TaskNotSubmitted();
        if (task.requester != msg.sender) revert Unauthorized();

        // Update status
        task.status = TaskStatus.REJECTED;

        // Update agent stats
        agentTasksRejected[task.agent]++;

        // Task can be re-opened or refunded by requester

        emit TaskRejected(taskId, task.agent);
    }

    /**
     * @notice Refund task to requester (after deadline or if rejected)
     * @param taskId The task to refund
     */
    function refundTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.requester != msg.sender) revert Unauthorized();
        if (task.status == TaskStatus.APPROVED) revert InvalidTask();

        // Can refund if:
        // 1. Deadline passed and not submitted
        // 2. Task was rejected
        bool canRefund = (
            (task.status == TaskStatus.OPEN && block.timestamp > task.deadline) ||
            (task.status == TaskStatus.CLAIMED && block.timestamp > task.deadline) ||
            (task.status == TaskStatus.REJECTED)
        );

        if (!canRefund) revert DeadlineNotPassed();

        // Calculate refund (includes platform fee)
        uint256 platformFee = (task.payoutUSDC * platformFeeBps) / 10000;
        uint256 refundAmount = task.payoutUSDC + platformFee;

        // Update status
        task.status = TaskStatus.REFUNDED;

        // Refund USDC
        usdc.safeTransfer(task.requester, refundAmount);

        emit TaskRefunded(taskId, task.requester, refundAmount);
    }

    // ============ View Functions ============

    /**
     * @notice Get task details
     * @param taskId The task identifier
     * @return task The full task struct
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Get agent reputation score (simple version)
     * @param agent Agent address
     * @return completed Number of completed tasks
     * @return rejected Number of rejected tasks
     * @return successRate Success rate in basis points (e.g., 9500 = 95%)
     */
    function getAgentReputation(address agent)
        external
        view
        returns (
            uint256 completed,
            uint256 rejected,
            uint256 successRate
        )
    {
        completed = agentTasksCompleted[agent];
        rejected = agentTasksRejected[agent];

        uint256 total = completed + rejected;
        successRate = total > 0 ? (completed * 10000) / total : 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update platform fee
     * @param newFeeBps New fee in basis points (e.g., 200 = 2%)
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee();
        platformFeeBps = newFeeBps;
    }

    /**
     * @notice Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
