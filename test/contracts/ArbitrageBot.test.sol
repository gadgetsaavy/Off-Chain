// test/ArbitrageBot.t.sol
import {test} from "forge-std/Test.sol";
import {ArbitrageBot} from "../src/ArbitrageBot.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "../src/interfaces/IUniswapV2Router02.sol";

contract ArbitrageBotTest is test {
    ArbitrageBot public bot;
    address public owner;
    address public router0;
    address public router1;
    address public token0;
    address public token1;

    function setUp() public {
        owner = address(this);
        bot = new ArbitrageBot(address(0x4200000000000000000000000000000000000001));
        
        // Set up test routers
        router0 = address(new MockRouter());
        router1 = address(new MockRouter());
        
        // Set up test tokens
        token0 = address(new MockToken("Token0", "TKN0"));
        token1 = address(new MockToken("Token1", "TKN1"));
        
        // Approve routers
        vm.prank(owner);
        bot.addRouter(router0);
        bot.addRouter(router1);
    }

    function testExecuteArbitrage() public {
        // Set up initial conditions
        uint256 amountIn = 100 ether;
        uint256 price0 = 150 ether;
        uint256 price1 = 200 ether;

        // Mock responses
        vm.mockCall(
            router0,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price0)
        );
        vm.mockCall(
            router1,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price1)
        );

        // Execute arbitrage
        vm.expectEmit(bot, ArbitrageBot.ProfitMade);
        vm.prank(owner);
        bot.executeArbitrage(router0, router1, token0, token1, amountIn);
    }

    function testExecuteArbitrageReversed() public {
        // Set up initial conditions
        uint256 amountIn = 100 ether;
        uint256 price0 = 200 ether;
        uint256 price1 = 150 ether;

        // Mock responses
        vm.mockCall(
            router0,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price0)
        );
        vm.mockCall(
            router1,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price1)
        );

        // Execute arbitrage
        vm.expectEmit(bot, ArbitrageBot.ProfitMade);
        vm.prank(owner);
        bot.executeArbitrage(router0, router1, token0, token1, amountIn);
    }

    function testExecuteArbitrageNoProfit() public {
        // Set up initial conditions
        uint256 amountIn = 100 ether;
        uint256 price0 = 150 ether;
        uint256 price1 = 140 ether;

        // Mock responses
        vm.mockCall(
            router0,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price0)
        );
        vm.mockCall(
            router1,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price1)
        );

        // Execute arbitrage
        vm.expectRevert("Profit too low");
        vm.prank(owner);
        bot.executeArbitrage(router0, router1, token0, token1, amountIn);
    }

    function testExecuteArbitrageInvalidRouter() public {
        // Set up initial conditions
        uint256 amountIn = 100 ether;
        uint256 price0 = 150 ether;
        uint256 price1 = 200 ether;

        // Mock responses
        vm.mockCall(
            router0,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price0)
        );
        vm.mockCall(
            router1,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price1)
        );

        // Execute arbitrage with invalid router
        vm.expectRevert("Router not approved");
        vm.prank(owner);
        bot.executeArbitrage(
            router0,
            address(0x123),
            token0,
            token1,
            amountIn
        );
    }

    function testExecuteArbitrageInvalidTokens() public {
        // Set up initial conditions
        uint256 amountIn = 100 ether;
        uint256 price0 = 150 ether;
        uint256 price1 = 200 ether;

        // Mock responses
        vm.mockCall(
            router0,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price0)
        );
        vm.mockCall(
            router1,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price1)
        );

        // Execute arbitrage with invalid tokens
        vm.expectRevert("Invalid tokens");
        vm.prank(owner);
        bot.executeArbitrage(
            router0,
            router1,
            token0,
            token0,
            amountIn
        );
    }

    function testExecuteArbitrageInvalidAmount() public {
        // Set up initial conditions
        uint256 amountIn = 0;
        uint256 price0 = 150 ether;
        uint256 price1 = 200 ether;

        // Mock responses
        vm.mockCall(
            router0,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price0)
        );
        vm.mockCall(
            router1,
            abi.encodeWithSelector(
                IUniswapV2Router02.getAmountOut.selector
            ),
            abi.encode(price1)
        );

        // Execute arbitrage with invalid amount
        vm.expectRevert("Invalid amount");
        vm.prank(owner);
        bot.executeArbitrage(router0, router1, token0, token1, amountIn);
    }

    function testSetMinProfit() public {
        uint256 newMinProfit = 50 ether;
        
        // Set new minimum profit
        vm.prank(owner);
        vm.expectEmit(bot, ArbitrageBot.MinProfitUpdated);
        bot.setMinProfit(newMinProfit);
        
        // Verify new minimum profit
        assertEq(bot.getMinProfit(), newMinProfit);
    }

    function testSetMinProfitInvalid() public {
        uint256 invalidMinProfit = 0;
        
        // Try to set invalid minimum profit
        vm.expectRevert("Min profit must be positive");
        bot.setMinProfit(invalidMinProfit);
    }

    function testAddRouter() public {
        address newRouter = address(new MockRouter());
        
        // Add new router
        vm.prank(owner);
        vm.expectEmit(bot, ArbitrageBot.RouterAdded);
        bot.addRouter(newRouter);
        
        // Verify router was added
        assertTrue(bot.approvedRouters(newRouter));
    }

    function testAddRouterInvalid() public {
        address invalidRouter = address(0);
        
        // Try to add invalid router
        vm.expectRevert("Invalid router");
        bot.addRouter(invalidRouter);
    }

    function testApproveToken() public {
        address newToken = address(new MockToken("NewToken", "NEW"));
        
        // Approve token
        vm.prank(owner);
        bot.approveToken(newToken, router0);
        
        // Verify token was approved
        assertTrue(bot.tokenApprovals(newToken)[router0]);
    }

    function testApproveTokenInvalid() public {
        address invalidToken = address(0);
        
        // Try to approve invalid token
        vm.expectRevert("Invalid token");
        bot.approveToken(invalidToken, router0);
    }
}