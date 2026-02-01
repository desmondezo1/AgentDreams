// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============ OpenZeppelin Dependencies (Flattened) ============

// IERC20.sol
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

// Address.sol
library Address {
    error AddressInsufficientBalance(address account);
    error AddressEmptyCode(address target);
    error FailedInnerCall();

    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert FailedInnerCall();
        }
    }

    function functionCall(
        address target,
        bytes memory data
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, bytes memory returndata) = target.call{value: value}(
            data
        );
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function functionStaticCall(
        address target,
        bytes memory data
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function functionDelegateCall(
        address target,
        bytes memory data
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    function verifyCallResult(
        bool success,
        bytes memory returndata
    ) internal pure returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            return returndata;
        }
    }

    function _revert(bytes memory returndata) private pure {
        if (returndata.length > 0) {
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert FailedInnerCall();
        }
    }
}

// SafeERC20.sol
library SafeERC20 {
    using Address for address;

    error SafeERC20FailedOperation(address token);
    error SafeERC20FailedDecreaseAllowance(
        address spender,
        uint256 currentAllowance,
        uint256 requestedDecrease
    );

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(
            token,
            abi.encodeCall(token.transferFrom, (from, to, value))
        );
    }

    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        bytes memory returndata = address(token).functionCall(
            abi.encodeCall(token.approve, (spender, value))
        );
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 requestedDecrease
    ) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(
                    spender,
                    currentAllowance,
                    requestedDecrease
                );
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    function forceApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        bytes memory approvalCall = abi.encodeCall(
            token.approve,
            (spender, value)
        );
        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(
                token,
                abi.encodeCall(token.approve, (spender, 0))
            );
            _callOptionalReturn(token, approvalCall);
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data);
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    function _callOptionalReturnBool(
        IERC20 token,
        bytes memory data
    ) private returns (bool) {
        (bool success, bytes memory returndata) = address(token).call(data);
        return
            success &&
            (returndata.length == 0 || abi.decode(returndata, (bool))) &&
            address(token).code.length > 0;
    }
}

// ReentrancyGuard.sol
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// ============ AgentDreamsEscrow Contract ============

/**
 * @title AgentDreamsEscrow
 * @author AgentDreams
 * @notice USDC escrow contract for AgentDreams task marketplace on Base
 * @dev Simple escrow: one escrow per task, settler-authorized release/refund
 *
 * Trust Model:
 * - Requester funds the escrow
 * - Worker receives payout upon release
 * - Settler (backend key) authorizes release/refund
 * - Owner manages settler and can pause/unpause
 *
 * Refund Policy (Policy 2 - trust-minimized):
 * - Settler can refund anytime (operational flexibility)
 * - Requester can refund after deadline (trustless fallback)
 *
 * Security Note: Settler has power to refund anytime, which means backend
 * can deny worker payout by refunding to requester. This is by design for
 * operational flexibility. Money always returns to requester, never stolen.
 */
contract AgentDreamsEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum Status {
        NONE, // Default/uninitialized
        FUNDED, // USDC locked in escrow
        RELEASED, // Payout sent to worker (terminal)
        REFUNDED // Payout returned to requester (terminal)
    }

    // ============ Structs ============

    struct Task {
        address requester; // Party that funded the escrow
        address worker; // Party that receives payout (set on release)
        uint256 payout; // Amount of USDC locked
        uint64 deadline; // Unix timestamp (seconds)
        Status status; // Current task status
        bytes32 resultHash; // Set on release for auditability
    }

    // ============ State Variables ============

    /// @notice The USDC token contract (immutable)
    IERC20 public immutable usdc;

    /// @notice Contract owner (can set settler, pause/unpause)
    address public owner;

    /// @notice Authorized settler address (backend key)
    address public settler;

    /// @notice Whether the contract is paused
    bool public paused;

    /// @notice Mapping of taskId to Task data
    mapping(bytes32 => Task) public tasks;

    // ============ Events ============

    event TaskCreated(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 payout,
        uint64 deadline
    );

    event TaskReleased(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 payout,
        bytes32 resultHash
    );

    event TaskRefunded(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 payout
    );

    event SettlerUpdated(
        address indexed oldSettler,
        address indexed newSettler
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event Paused(address indexed account);

    event Unpaused(address indexed account);

    // ============ Custom Errors ============

    error ContractPaused();
    error ContractNotPaused();
    error AlreadyPaused();
    error NotPaused();
    error NotOwner();
    error NotSettler();
    error NotAuthorized();
    error TaskAlreadyExists();
    error TaskNotFunded();
    error TaskFinalized();
    error InvalidAddress();
    error InvalidPayout();
    error InvalidDeadline();
    error InvalidTaskId();
    error InvalidResultHash();
    error DeadlineNotReached();
    error CannotRescueUSDC();
    error ETHNotAccepted();

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySettler() {
        if (msg.sender != settler) revert NotSettler();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the escrow contract
     * @param usdc_ Address of the USDC token contract
     * @param settler_ Address of the authorized settler
     * @param owner_ Address of the contract owner
     */
    constructor(address usdc_, address settler_, address owner_) {
        if (usdc_ == address(0)) revert InvalidAddress();
        if (settler_ == address(0)) revert InvalidAddress();
        if (owner_ == address(0)) revert InvalidAddress();

        usdc = IERC20(usdc_);
        settler = settler_;
        owner = owner_;

        emit SettlerUpdated(address(0), settler_);
        emit OwnershipTransferred(address(0), owner_);
    }

    // ============ Receive/Fallback (Reject ETH) ============

    /// @notice Reject any ETH sent directly to the contract
    receive() external payable {
        revert ETHNotAccepted();
    }

    /// @notice Reject any ETH sent with data
    fallback() external payable {
        revert ETHNotAccepted();
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new escrow task by depositing USDC
     * @dev Caller must have approved this contract to spend `payout` USDC
     * @param taskId Unique identifier for the task (recommend: keccak256 of UUID)
     * @param payout Amount of USDC to lock in escrow
     * @param deadline Unix timestamp after which requester can self-refund
     */
    function createTask(
        bytes32 taskId,
        uint256 payout,
        uint64 deadline
    ) external whenNotPaused nonReentrant {
        // Validate inputs
        if (taskId == bytes32(0)) revert InvalidTaskId();
        if (tasks[taskId].status != Status.NONE) revert TaskAlreadyExists();
        if (payout == 0) revert InvalidPayout();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        // Transfer USDC first (best practice: transfer before state change)
        usdc.safeTransferFrom(msg.sender, address(this), payout);

        // Initialize task storage after successful transfer
        tasks[taskId] = Task({
            requester: msg.sender,
            worker: address(0),
            payout: payout,
            deadline: deadline,
            status: Status.FUNDED,
            resultHash: bytes32(0)
        });

        emit TaskCreated(taskId, msg.sender, payout, deadline);
    }

    /**
     * @notice Release escrowed funds to the worker
     * @dev Only callable by settler. Requires non-zero resultHash for auditability.
     * @param taskId The task to release
     * @param worker Address to receive the payout
     * @param resultHash Hash of the work result (must be non-zero for audit trail)
     */
    function release(
        bytes32 taskId,
        address worker,
        bytes32 resultHash
    ) external onlySettler whenNotPaused nonReentrant {
        Task storage task = tasks[taskId];

        // Validate task state
        if (task.status == Status.NONE) revert TaskNotFunded();
        if (task.status != Status.FUNDED) revert TaskFinalized();
        if (worker == address(0)) revert InvalidAddress();
        if (resultHash == bytes32(0)) revert InvalidResultHash();

        // Cache payout for event and transfer
        uint256 payout = task.payout;

        // Update state BEFORE transfer (checks-effects-interactions)
        task.worker = worker;
        task.resultHash = resultHash;
        task.status = Status.RELEASED;

        // Transfer USDC to worker
        usdc.safeTransfer(worker, payout);

        emit TaskReleased(taskId, worker, payout, resultHash);
    }

    /**
     * @notice Refund escrowed funds to the requester
     * @dev Settler can refund anytime; requester can refund after deadline
     * @param taskId The task to refund
     */
    function refund(bytes32 taskId) external whenNotPaused nonReentrant {
        Task storage task = tasks[taskId];

        // Validate task state
        if (task.status == Status.NONE) revert TaskNotFunded();
        if (task.status != Status.FUNDED) revert TaskFinalized();

        // Authorization check (Policy 2: trust-minimized)
        if (msg.sender == settler) {
            // Settler can refund anytime (operational flexibility)
        } else if (msg.sender == task.requester) {
            // Requester can only refund after deadline (trustless fallback)
            if (block.timestamp < task.deadline) revert DeadlineNotReached();
        } else {
            revert NotAuthorized();
        }

        // Cache values for event and transfer
        address requester = task.requester;
        uint256 payout = task.payout;

        // Update state BEFORE transfer (checks-effects-interactions)
        task.status = Status.REFUNDED;

        // Transfer USDC back to requester
        usdc.safeTransfer(requester, payout);

        emit TaskRefunded(taskId, requester, payout);
    }

    // ============ View Functions ============

    /**
     * @notice Get full task details
     * @param taskId The task identifier
     * @return The Task struct
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the settler address
     * @dev Only callable by owner
     * @param newSettler New settler address
     */
    function setSettler(address newSettler) external onlyOwner {
        if (newSettler == address(0)) revert InvalidAddress();

        address oldSettler = settler;
        settler = newSettler;

        emit SettlerUpdated(oldSettler, newSettler);
    }

    /**
     * @notice Transfer ownership of the contract
     * @dev Only callable by owner
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Pause the contract
     * @dev Only callable by owner. Blocks createTask, release, refund.
     *      Reverts if already paused.
     */
    function pause() external onlyOwner {
        if (paused) revert AlreadyPaused();
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     * @dev Only callable by owner. Reverts if not paused.
     */
    function unpause() external onlyOwner {
        if (!paused) revert NotPaused();
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Rescue accidentally sent tokens (NOT USDC)
     * @dev Only callable by owner. Cannot rescue USDC to protect escrow funds.
     * @param token The token to rescue
     * @param to Recipient address
     * @param amount Amount to rescue
     */
    function rescueToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(usdc)) revert CannotRescueUSDC();
        if (to == address(0)) revert InvalidAddress();

        IERC20(token).safeTransfer(to, amount);
    }
}
