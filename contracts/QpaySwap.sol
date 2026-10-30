// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract QpaySwap {
    uint256 private constant MAX_HISTORY = 500;

    struct SwapRecord {
        bytes32 txHash;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        uint256 blockNumber;
    }

    error InvalidAmount();
    error SameToken();
    error UnauthorizedRecorder();

    mapping(address => SwapRecord[]) private _history;
    mapping(address => uint256) private _count;

    event SwapRecorded(
        address indexed wallet,
        bytes32 txHash,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    function recordSwap(address wallet, bytes32 txHash, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut) external {
        if (wallet != msg.sender) revert UnauthorizedRecorder();
        if (amountIn == 0 || amountOut == 0) revert InvalidAmount();
        if (tokenIn == tokenOut) revert SameToken();

        SwapRecord[] storage walletHistory = _history[wallet];
        uint256 currentCount = _count[wallet];

        SwapRecord memory newRecord = SwapRecord({
            txHash: txHash,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        if (walletHistory.length < MAX_HISTORY) {
            walletHistory.push(newRecord);
        } else {
            walletHistory[currentCount % MAX_HISTORY] = newRecord;
        }

        _count[wallet] = currentCount + 1;

        emit SwapRecorded(wallet, txHash, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getSwapHistory(address wallet) external view returns (SwapRecord[] memory) {
        SwapRecord[] storage walletHistory = _history[wallet];
        uint256 total = _count[wallet];
        uint256 length = walletHistory.length;

        if (length == 0) {
            return new SwapRecord[](0);
        }

        SwapRecord[] memory orderedHistory = new SwapRecord[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 index = (total - 1 - i) % length;
            orderedHistory[i] = walletHistory[index];
        }

        return orderedHistory;
    }

    function getSwapCount(address wallet) external view returns (uint256) {
        return _count[wallet];
    }
}
