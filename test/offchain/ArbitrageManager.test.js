// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {ArbitrageManager} from "../src/offchain/ArbitrageManager.js";
import {ProfitDetector} from "../src/offchain/ProfitDetector.js";
import {ArbitrageExecutor} from "../src/offchain/ArbitrageExecutor.js";
import {FlashbotsClient} from "../src/offchain/FlashbotsClient.js";

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

contract ArbitrageManagerTest is Test {
    ArbitrageManager public manager;
    ProfitDetector public detector;
    ArbitrageExecutor public executor;
    FlashbotsClient public flashbotsClient;

    function setUp() public {
        // Initialize components
        detector = new ProfitDetector({
            web3: new Web3("http://localhost:8545"),
            routers: [address(new MockRouter())],
            thresholds: { minProfit: 10 ether }
        });

        executor = new ArbitrageExecutor({
            flashbots: new FlashbotsClient({
                url: "https://relay.flashbots.net",
                privateKey: "0x1234567890abcdef"
            }),
            provider: new Web3("http://localhost:8545")
        });

        manager = new ArbitrageManager({
            detectorConfig: {
                web3: new Web3("http://localhost:8545"),
                routers: [address(new MockRouter())],
                thresholds: { minProfit: 10 ether }
            },
            executorConfig: {
                flashbots: new FlashbotsClient({
                    url: "https://relay.flashbots.net",
                    privateKey: "0x1234567890abcdef"
                }),
                provider: new Web3("http://localhost:8545")
            }
        });
    }

    function testProcessOpportunities() public {
        // Mock detector to return opportunities
        vm.mockCall(
            address(detector),
            abi.encodeWithSelector(
                ProfitDetector.detectOpportunities.selector
            ),
            abi.encode([{
                token0: address(new MockToken("TKN0", "TKN0")),
                token1: address(new MockToken("TKN1", "TKN1")),
                amountIn: 100 ether,
                routers: [address(new MockRouter())],
                amountsOut: [150 ether]
            }])
        );

        // Process opportunities
        manager.processOpportunities();

        // Verify execution
        assertEq(manager.cache.size, 1, "Cache should contain one opportunity");
    }

    function testShouldExecute() public {
        // Create test opportunity
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageManager.Opportunity memory opportunity = ArbitrageManager.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        // Test shouldExecute returns true for new opportunity
        assertTrue(manager.shouldExecute(opportunity), "Should execute new opportunity");

        // Add to cache
        manager.cache.set(this.getOpportunityId(opportunity), true);

        // Test shouldExecute returns false for cached opportunity
        assertFalse(manager.shouldExecute(opportunity), "Should not execute cached opportunity");
    }

    function testCalculateProfit() public {
        // Create test opportunity
        MockToken token0 = new MockToken("TKN0", "TKN0");
        MockToken token1 = new MockToken("TKN1", "TKN1");
        MockRouter router = new MockRouter();

        address*An external link was removed to protect your privacy.*;
        routers = address(router);

        uint256*An external link was removed to protect your privacy.*;
        amountsOut = 150 ether;

        ArbitrageManager.Opportunity memory opportunity = ArbitrageManager.Opportunity({
            token0: address(token0),
            token1: address(token1),
            amountIn: 100 ether,
            routers: routers,
            amountsOut: amountsOut
        });

        // Calculate profit
        uint256 profit = manager.calculateProfit(opportunity);
        assertEq(profit, 50 ether, "Profit calculation incorrect");
    }

    function testProcessOpportunitiesMultiple() public {
        // Mock detector to return multiple opportunities
        vm.mockCall(
            address(detector),
            abi.encodeWithSelector(
                ProfitDetector.detectOpportunities.selector
            ),
            abi.encode([{
                token0: address(new MockToken("TKN0", "TKN0")),
                token1: address(new MockToken("TKN1", "TKN1")),
                amountIn: 100 ether,
                routers: [address(new MockRouter())],
                amountsOut: [150 ether]
            }, {
                token0: address(new MockToken("TKN2", "TKN2")),
                token1: address(new MockToken("TKN3", "TKN3")),
                amountIn: 200 ether,
                routers: [address(new MockRouter())],
                amountsOut: [300 ether]
            }])
        );

        // Process opportunities
        manager.processOpportunities();

        // Verify cache size
        assertEq(manager.cache.size, 2, "Cache should contain two opportunities");
    }

    function testProcessOpportunitiesBelowThreshold() public {
        // Mock detector to return opportunity below threshold
        vm.mockCall(
            address(detector),
            abi.encodeWithSelector(
                ProfitDetector.detectOpportunities.selector
            ),
            abi.encode([{
                token0: address(new MockToken("TKN0", "TKN0")),
                token1: address(new MockToken("TKN1", "TKN1")),
                amountIn: 100 ether,
                routers: [address(new MockRouter())],
                amountsOut: [105 ether] // Profit of 5 ether (below threshold)
            }])
        );

        // Process opportunities
        manager.processOpportunities();

        // Verify cache size
        assertEq(manager.cache.size, 1, "Cache should contain one opportunity");
    }

    function getOpportunityId(ArbitrageManager.Opportunity memory opportunity) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                opportunity.token0,
                opportunity.token1,
                opportunity.amountIn,
                opportunity.routers,
                opportunity.amountsOut
            )
        );
    }
}