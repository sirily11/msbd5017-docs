import { Checker } from '@/lib/interfaces'

export const source = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenExchange {
    IUniswapV2Router02 public router;
    address public tokenA;
    address public tokenB;

    event LiquidityAdded(
        address indexed provider,
        uint amountA,
        uint amountB,
        uint liquidity
    );
    event TokensSwapped(
        address indexed swapper,
        address tokenIn,
        address tokenOut,
        uint amountIn,
        uint amountOut
    );

    constructor(address _router, address _tokenA, address _tokenB) {
        router = IUniswapV2Router02(_router);
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /**
     * Add liquidity for the tokenA/tokenB pair via the Uniswap V2 Router.
     * Tokens must already be approved by msg.sender for this contract.
     *
     * Steps:
     * 1. Transfer amountA of tokenA and amountB of tokenB from msg.sender
     * 2. Approve the router to spend both tokens
     * 3. Call router.addLiquidity with a deadline of block.timestamp
     * 4. Emit a LiquidityAdded event with the actual amounts used and LP tokens received
     */
    function addLiquidity(
        uint amountA,
        uint amountB
    ) external returns (uint liquidity) {
        // TODO: implement
    }

    /**
     * Swap an exact amount of tokenIn for as many tokenOut as possible
     * via the Uniswap V2 Router.
     * tokenIn must be either tokenA or tokenB; tokenOut is the other one.
     *
     * Steps:
     * 1. Transfer amountIn of tokenIn from msg.sender
     * 2. Approve the router to spend tokenIn
     * 3. Build the swap path [tokenIn, tokenOut]
     * 4. Call router.swapExactTokensForTokens with a deadline of block.timestamp
     * 5. Transfer the received tokenOut back to msg.sender
     * 6. Emit a TokensSwapped event
     */
    function swapTokens(
        address tokenIn,
        uint amountIn,
        uint amountOutMin
    ) external returns (uint amountOut) {
        // TODO: implement
    }
}
`

export const solution = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenExchange {
    IUniswapV2Router02 public router;
    address public tokenA;
    address public tokenB;

    event LiquidityAdded(
        address indexed provider,
        uint amountA,
        uint amountB,
        uint liquidity
    );
    event TokensSwapped(
        address indexed swapper,
        address tokenIn,
        address tokenOut,
        uint amountIn,
        uint amountOut
    );

    constructor(address _router, address _tokenA, address _tokenB) {
        router = IUniswapV2Router02(_router);
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(
        uint amountA,
        uint amountB
    ) external returns (uint liquidity) {
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        IERC20(tokenA).approve(address(router), amountA);
        IERC20(tokenB).approve(address(router), amountB);

        (uint actualA, uint actualB, uint liq) = router.addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            0,
            0,
            msg.sender,
            block.timestamp
        );

        liquidity = liq;
        emit LiquidityAdded(msg.sender, actualA, actualB, liq);
    }

    function swapTokens(
        address tokenIn,
        uint amountIn,
        uint amountOutMin
    ) external returns (uint amountOut) {
        address tokenOut = tokenIn == tokenA ? tokenB : tokenA;

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(router), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        amountOut = amounts[1];
        emit TokensSwapped(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut
        );
    }
}
`

export const checker: Checker = async (solcOutput) => {
  return [false, '']
}
