// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {ArbitrageExecutor} from "../src/offchain/ArbitrageExecutor.js";
import {FlashbotsClient} from "../src/offchain/FlashbotsClient.js";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "../src/interfaces/IUniswapV2Router02.sol";

contract MockToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        totalSupply = 1000000 * 10**18;
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }
}

contract MockRouter is IUniswapV2Router02 {
    function getAmountsOut(uint256 amountIn, address[] calldata path) external pure returns (uint256[] memory amounts) {
        amounts = new uint256*An external link was removed to protect your privacy.*;
        amounts = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = amounts[i - 1] * 2; // Mock doubling the amount for simplicity
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "MockRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IERC20(path).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[path.length - 1]).transfer(to, amounts[amounts.length - 1]);
    }
}

contract ArbitrageExecutorTest is Test {
    ArbitrageExecutor public executor;
    FlashbotsClient public flashbotsClient;
    address public owner;
    address public user;

    function setUp() public {
        owner = address(this);
        user = address(0x123);

        // Initialize components
        flashbotsClient = new FlashbotsClient({
            url: "https://relay.flashbots.net",
            privateKey: "0x1234567890abcdef"
        });

        executor = new ArbitrageExecutor({
            flashbots: flashbotsClient,
            provider: new Web3("http://localhost:8545")
        });
    }

    function testExecuteOpportunity() public {
        // Create test opportunity
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        // Execute opportunity
        bytes32 txHash = executor.executeOpportunity(opportunity);
        assertGt(uint256(txHash), 0, "Transaction hash should not be zero");
    }

    function testExecuteOpportunityRevertsWhenInvalidRouter() public {
        // Create test opportunity with invalid router
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");

        address*An external link was removed to protect your privacy.*;
        routers = address(0);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        vm.expectRevert("Invalid router");
        executor.executeOpportunity(opportunity);
    }

    function testExecuteOpportunityRevertsWhenInvalidTokens() public {
        // Create test opportunity with invalid tokens
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        vm.expectRevert("Invalid token");
        executor.executeOpportunity(opportunity);
    }

    function testExecuteOpportunityRevertsWhenInvalidAmount() public {
        // Create test opportunity with invalid amount
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 0,
            routers: routers,
            amountsOut: amountsOut
        });

        vm.expectRevert("Invalid amount");
        executor.executeOpportunity(opportunity);
    }

    function testExecuteOpportunityWithMultipleRouters() public {
        // Create test opportunity with multiple routers
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router1 = new MockRouter();
        MockRouter router2 = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router1);
        routers = address(router2);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;
        amountsOut = 200 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        // Execute opportunity
        bytes32 txHash = executor.executeOpportunity(opportunity);
        assertGt(uint256(txHash), 0, "Transaction hash should not be zero");
    }

    function testExecuteOpportunityWithHighGasPrice() public {
        // Create test opportunity
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        // Set high gas price
        executor.maxGasPrice = 1000 gwei;

        // Execute opportunity
        bytes32 txHash = executor.executeOpportunity(opportunity);
        assertGt(uint256(txHash), 0, "Transaction hash should not be zero");
    }

    function testExecuteOpportunityRevertsWhenGasPriceTooHigh() public {
        // Create test opportunity
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageExecutor.Opportunity memory opportunity = ArbitrageExecutor.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        // Set high gas price
        executor.maxGasPrice = 1000 gwei;

        // Execute opportunity with higher gas price
        vm.expectRevert("Exceeds max gas price");
        executor.executeOpportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut,
            gasPrice: 2000 gwei
        });
    }
}