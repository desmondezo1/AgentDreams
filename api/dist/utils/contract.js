"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEscrowInstructions = exports.toBytes32 = void 0;
const ethers_1 = require("ethers");
const toBytes32 = (uuid) => {
    return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(uuid));
};
exports.toBytes32 = toBytes32;
const getEscrowInstructions = (taskIdBytes32, payout, deadline, contractAddress, usdcAddress) => {
    const iface = new ethers_1.ethers.Interface([
        'function createTask(bytes32 taskId, uint256 payout, uint64 deadline)'
    ]);
    const payoutWei = ethers_1.ethers.parseUnits(payout, 6); // USDC has 6 decimals
    const callData = iface.encodeFunctionData('createTask', [
        taskIdBytes32,
        payoutWei,
        deadline
    ]);
    return {
        usdc_address: usdcAddress,
        escrow_contract_address: contractAddress,
        payout_formatted: payout,
        payout_units: payoutWei.toString(),
        deadline,
        call_data: callData
    };
};
exports.getEscrowInstructions = getEscrowInstructions;
