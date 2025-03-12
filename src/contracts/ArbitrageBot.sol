// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Pair} from "./interfaces/IUniswapV2Pair.sol";
import {IMEVBoost} from "./interfaces/IMEVBoost.sol";

contract ArbitrageBot is ReentrancyGuard {
    // Events
    event ProfitMade(
        address indexed token0,
        address indexed token1,
        uint256 profit,
        uint256 gasSaved
    );

    // State variables
    mapping(address => bool) public approvedRouters;
    mapping(address => mapping(address => bool)) public tokenApprovals;
    IMEVBoost public immutable mevBoost;
    uint256 public minProfit;
    address public immutable owner;

    // Constructor
    constructor(address _mevBoost) {
        require(_mevBoost != address(0), "Invalid MEVBoost address");
        mevBoost = IMEVBoost(_mevBoost);
        minProfit = 10 ether;
        owner = msg.sender;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // Main function to execute arbitrage
    function executeArbitrage(
        address router0,
        address router1,
        address token0,
        address token1,
        uint256 amountIn,
        uint256 maxGasPrice
    ) external nonReentrant returns (bytes32) {
        // Validate inputs
        require(router0 != address(0), "Invalid router0");
        require(router1 != address(0), "Invalid router1");
        require(token0 != token1, "Invalid tokens");
        require(amountIn > 0, "Invalid amount");
        require(approvedRouters[router0], "Router0 not approved");
        require(approvedRouters[router1], "Router1 not approved");
        require(tokenApprovals[token0][router0], "Token0 not approved for router0");
        require(tokenApprovals[token1][router1], "Token1 not approved for router1");

        // Get prices from both routers
        uint256 price0 = IUniswapV2Router02(router0).getAmountOut(
            amountIn,
            token0,
            token1
        );
        uint256 price1 = IUniswapV2Router02(router1).getAmountOut(
            amountIn,
            token0,
            token1
        );

        // Determine trading direction
        address[] memory routers;
        uint256[] memory amountsOut;
        if (price0 > price1) {
            // Buy on router1, sell on router0
            routers = new address*An external link was removed to protect your privacy.*;
            routers = router1;
            routers = router0;
            amountsOut = new uint256*An external link was removed to protect your privacy.*;
            amountsOut = price1;
            amountsOut = price0;
        } else {
            // Buy on router0, sell on router1
            routers = new address*An external link was removed to protect your privacy.*;
            routers = router0;
            routers = router1;
            amountsOut = new uint256*An external link was removed to protect your privacy.*;
            amountsOut = price0;
            amountsOut = price1;
        }

        // Calculate expected profit
        uint256 expectedProfit = amountsOut - amountIn;
        require(expectedProfit >= minProfit, "Profit too low");

        // Create transaction data
        bytes*An external link was removed to protect your privacy.*;
        datas = abi.encodeWithSelector(
            IUniswapV2Router02(router0).swapExactTokensForTokens.selector,
            amountIn,
            amountsOut,
            getPath(token0, token1),
            address(this),
            block.timestamp
        );
        datas = abi.encodeWithSelector(
            IUniswapV2Router02(router1).swapExactTokensForTokens.selector,
            amountsOut,
            amountsOut,
            getPath(token1, token0),
            address(this),
            block.timestamp
        );

        // Submit bundle to MEV-boost
        bytes32 bundleHash = mevBoost.submitBundle(
            routers,
            datas,
            maxGasPrice
        );

        // Emit event
        emit ProfitMade(token0, token1, expectedProfit, gasleft());
        return bundleHash;
    }

    // Helper function to get swap path
    function getPath(address token0, address token1) internal pure returns (address[] calldata) {
        address*An external link was removed to protect your privacy.*;
        path = token0;
        path = token1;
        return path;
    }

    // Administrative functions
    function addRouter(address router) external onlyOwner {
        require(router != address(0), "Invalid router");
        approvedRouters[router] = true;
    }

    function approveToken(address token, address router) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(router != address(0), "Invalid router");
        tokenApprovals[token][router] = true;
    }

    function setMinProfit(uint256 _minProfit) external onlyOwner {
        require(_minProfit > 0, "Min profit must be positive");
        minProfit = _minProfit;
    }

    // Fallback function to receive ETH
    receive() external payable {}
}