// test/MEVBoostWrapper.t.sol
import {test} from "forge-std/Test.sol";
import {MEVBoostWrapper} from "../src/MEVBoostWrapper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "../src/interfaces/IUniswapV2Router02.sol";
import {IMEVBoost} from "../src/interfaces/IMEVBoost.sol";

contract MEVBoostWrapperTest is test {
    MEVBoostWrapper public mevWrapper;
    IMEVBoost public mevBoost;
    IUniswapV2Router02 public router;
    IERC20 public token0;
    IERC20 public token1;
    address public owner;
    address public user;

    function setUp() public {
        owner = address(this);
        user = address(0x123);
        
        // Deploy contracts
        mevBoost = IMEVBoost(address(new MockMEVBoost()));
        router = IUniswapV2Router02(address(new MockRouter()));
        token0 = IERC20(address(new MockToken("Token0", "TKN0")));
        token1 = IERC20(address(new MockToken("Token1", "TKN1")));
        
        // Deploy MEVBoostWrapper
        mevWrapper = new MEVBoostWrapper(address(mevBoost));
    }

    function testSubmitBundle() public {
        // Set up transaction data
        bytes memory data = abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector,
            100 ether,
            0,
            getPath(address(token0), address(token1)),
            address(this),
            block.timestamp
        );

        // Submit bundle
        bytes32 bundleHash = mevWrapper.submitBundle(
            address(router),
            data,
            20 gwei
        );

        // Verify bundle hash is not zero
        assertGt(bundleHash, bytes32(0));
    }

    function testSubmitBundleRevertsWhenGasPriceTooHigh() public {
        // Set up transaction data
        bytes memory data = abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector,
            100 ether,
            0,
            getPath(address(token0), address(token1)),
            address(this),
            block.timestamp
        );

        // Try to submit with high gas price
        vm.expectRevert("Exceeds max gas price");
        mevWrapper.submitBundle(
            address(router),
            data,
            1000 ether
        );
    }

    function testSubmitBundleRevertsWhenInvalidRouter() public {
        // Set up transaction data
        bytes memory data = abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector,
            100 ether,
            0,
            getPath(address(token0), address(token1)),
            address(this),
            block.timestamp
        );

        // Try to submit with invalid router
        vm.expectRevert("Invalid router");
        mevWrapper.submitBundle(
            address(0),
            data,
            20 gwei
        );
    }

    function testSubmitBundleRevertsWhenInvalidData() public {
        // Try to submit with invalid data
        vm.expectRevert("Invalid transaction data");
        mevWrapper.submitBundle(
            address(router),
            "",
            20 gwei
        );
    }

    function testSignBundle() public {
        // Set up transaction data
        bytes memory data = abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector,
            100 ether,
            0,
            getPath(address(token0), address(token1)),
            address(this),
            block.timestamp
        );

        // Sign bundle
        bytes memory signedTx = mevWrapper.signBundle(
            address(this),
            address(router),
            data,
            20 gwei
        );

        // Verify signature is not empty
        assertGt(signedTx.length, 0);
    }

    function testSignBundleRevertsWhenInvalidSigner() public {
        // Set up transaction data
        bytes memory data = abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector,
            100 ether,
            0,
            getPath(address(token0), address(token1)),
            address(this),
            block.timestamp
        );

        // Try to sign with invalid signer
        vm.expectRevert("Invalid signer");
        mevWrapper.signBundle(
            address(0),
            address(router),
            data,
            20 gwei
        );
    }

    function testSignBundleRevertsWhenInvalidRouter() public {
        // Set up transaction data
        bytes memory data = abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector,
            100 ether,
            0,
            getPath(address(token0), address(token1)),
            address(this),
            block.timestamp
        );

        // Try to sign with invalid router
        vm.expectRevert("Invalid router");
        mevWrapper.signBundle(
            address(this),
            address(0),
            data,
            20 gwei
        );
    }

    function testSignBundleRevertsWhenInvalidData() public {
        // Try to sign with invalid data
        vm.expectRevert("Invalid transaction data");
        mevWrapper.signBundle(
            address(this),
            address(router),
            "",
            20 gwei
        );
    }

    function testCalculateMaxFee() public {
        uint256 maxFee = mevWrapper.calculateMaxFee();
        assertGt(maxFee, 0);
    }

    function testCalculatePriorityFee() public {
        uint256 priorityFee = mevWrapper.calculatePriorityFee();
        assertGt(priorityFee, 0);
    }

    function getPath(address token0, address token1) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;
        return path;
    }
}