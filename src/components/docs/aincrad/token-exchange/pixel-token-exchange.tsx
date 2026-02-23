'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pixelify_Sans } from 'next/font/google'
import { useSolidity } from '@/context/solidityContext'
import { VM } from '@ethereumjs/vm'
import { Address, bytesToHex, hexToBytes } from '@ethereumjs/util'
import {
  buildTransaction,
  decodeRevertMessage,
  deployContract,
  encodeFunction,
  getAccountNonce,
  insertAccount,
} from '@/context/solidityContext.utils'
import { HDNodeWallet } from 'ethers'
import { Interface } from '@ethersproject/abi'
import { LegacyTransaction } from '@ethereumjs/tx'
import './style.css'

// Pre-compiled Uniswap V2 build artifacts
import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json'
import UniswapV2Router02 from '@uniswap/v2-periphery/build/UniswapV2Router02.json'
import WETH9 from '@uniswap/v2-periphery/build/WETH9.json'
import ERC20Build from '@uniswap/v2-core/build/ERC20.json'

const font = Pixelify_Sans({
  subsets: ['latin'],
})

const TOKEN_SUPPLY = BigInt('1000000000000000000000000') // 1,000,000 tokens (18 decimals)
const ONE_TOKEN = BigInt('1000000000000000000') // 1 token (18 decimals)

async function deployPrecompiled(
  vm: VM,
  privateKey: Uint8Array,
  bytecode: string,
  params: { types: any[]; values: unknown[] },
) {
  return await deployContract(vm, privateKey, bytecode, params)
}

async function callFunction(
  vm: VM,
  privateKey: Uint8Array,
  contractAddress: Address,
  method: string,
  params: { types: any[]; values: unknown[] },
  value?: string,
) {
  const data = encodeFunction(method, params)
  const txData = {
    to: contractAddress,
    data,
    value: value || '0x0',
    nonce: await getAccountNonce(vm, privateKey),
    gasLimit: 5_000_000,
  }
  const tx = LegacyTransaction.fromTxData(
    buildTransaction(txData as any) as any,
    { common: vm.common },
  ).sign(privateKey)

  const result = await vm.runTx({ tx })
  if (result.execResult.exceptionError) {
    const message = decodeRevertMessage(result.execResult.returnValue)
    throw new Error(message)
  }
  return result
}

export default function PixelTokenExchangeComponent() {
  const { compilerOutput, isCompiling, vm, account } = useSolidity()
  const [contractAddress, setContractAddress] = useState<Address | null>(null)
  const [tokenAAddress, setTokenAAddress] = useState<Address | null>(null)
  const [tokenBAddress, setTokenBAddress] = useState<Address | null>(null)
  const [liquidityAmountA, setLiquidityAmountA] = useState('')
  const [liquidityAmountB, setLiquidityAmountB] = useState('')
  const [swapAmount, setSwapAmount] = useState('')
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB')
  const [balanceA, setBalanceA] = useState('0')
  const [balanceB, setBalanceB] = useState('0')
  const [showDialog, setShowDialog] = useState(false)
  const [dialogContent, setDialogContent] = useState({ title: '', content: '' })
  const [isDeploying, setIsDeploying] = useState(false)
  const [swapperAccount] = useState(() => HDNodeWallet.createRandom())
  const [priceAtoB, setPriceAtoB] = useState('—')
  const [priceBtoA, setPriceBtoA] = useState('—')
  const [priceAtoEth, setPriceAtoEth] = useState('—')
  const [priceBtoEth, setPriceBtoEth] = useState('—')

  const showMessage = (title: string, content: string) => {
    setDialogContent({ title, content })
    setShowDialog(true)
  }

  const refreshBalances = async () => {
    if (!vm || !tokenAAddress || !tokenBAddress || !account) return
    try {
      const iface = new Interface([
        'function balanceOf(address) view returns (uint256)',
      ])
      const balA = await getBalance(
        vm,
        tokenAAddress,
        account.address,
        iface,
      )
      const balB = await getBalance(
        vm,
        tokenBAddress,
        account.address,
        iface,
      )
      setBalanceA(balA)
      setBalanceB(balB)
    } catch (error) {
      console.error('Error refreshing balances:', error)
    }
  }

  const refreshPrices = async () => {
    if (!vm || !contractAddress || !tokenAAddress || !tokenBAddress) return
    const priceIface = new Interface([
      'function getTokenPrice(address,uint256) view returns (uint256)',
      'function getTokenEthPrice(address,uint256) view returns (uint256)',
    ])

    try {
      const aToBData = priceIface.encodeFunctionData('getTokenPrice', [
        tokenAAddress.toString(),
        ONE_TOKEN.toString(),
      ])
      const aToBResult = await vm.evm.runCall({
        to: contractAddress,
        data: hexToBytes(aToBData as `0x${string}`),
      })
      if (!aToBResult.execResult.exceptionError) {
        const decoded = priceIface.decodeFunctionResult(
          'getTokenPrice',
          bytesToHex(aToBResult.execResult.returnValue),
        )
        setPriceAtoB(decoded[0].toString())
      } else {
        setPriceAtoB('—')
      }
    } catch {
      setPriceAtoB('—')
    }

    try {
      const bToAData = priceIface.encodeFunctionData('getTokenPrice', [
        tokenBAddress.toString(),
        ONE_TOKEN.toString(),
      ])
      const bToAResult = await vm.evm.runCall({
        to: contractAddress,
        data: hexToBytes(bToAData as `0x${string}`),
      })
      if (!bToAResult.execResult.exceptionError) {
        const decoded = priceIface.decodeFunctionResult(
          'getTokenPrice',
          bytesToHex(bToAResult.execResult.returnValue),
        )
        setPriceBtoA(decoded[0].toString())
      } else {
        setPriceBtoA('—')
      }
    } catch {
      setPriceBtoA('—')
    }

    try {
      const aEthData = priceIface.encodeFunctionData('getTokenEthPrice', [
        tokenAAddress.toString(),
        ONE_TOKEN.toString(),
      ])
      const aEthResult = await vm.evm.runCall({
        to: contractAddress,
        data: hexToBytes(aEthData as `0x${string}`),
      })
      if (!aEthResult.execResult.exceptionError) {
        const decoded = priceIface.decodeFunctionResult(
          'getTokenEthPrice',
          bytesToHex(aEthResult.execResult.returnValue),
        )
        setPriceAtoEth(decoded[0].toString())
      } else {
        setPriceAtoEth('—')
      }
    } catch {
      setPriceAtoEth('—')
    }

    try {
      const bEthData = priceIface.encodeFunctionData('getTokenEthPrice', [
        tokenBAddress.toString(),
        ONE_TOKEN.toString(),
      ])
      const bEthResult = await vm.evm.runCall({
        to: contractAddress,
        data: hexToBytes(bEthData as `0x${string}`),
      })
      if (!bEthResult.execResult.exceptionError) {
        const decoded = priceIface.decodeFunctionResult(
          'getTokenEthPrice',
          bytesToHex(bEthResult.execResult.returnValue),
        )
        setPriceBtoEth(decoded[0].toString())
      } else {
        setPriceBtoEth('—')
      }
    } catch {
      setPriceBtoEth('—')
    }
  }

  // Deploy infrastructure when compiler output changes
  useEffect(() => {
    if (!compilerOutput || !account || !vm) return

    const setup = async () => {
      setIsDeploying(true)
      try {
        const pk = hexToBytes(account.privateKey)
        const swapperAddr = Address.fromString(swapperAccount.address)
        await insertAccount(vm, swapperAddr)

        // 1. Deploy WETH9
        const wethAddr = await deployPrecompiled(vm, pk, WETH9.bytecode, {
          types: [],
          values: [],
        })

        // 2. Deploy UniswapV2Factory
        const factoryAddr = await deployPrecompiled(
          vm,
          pk,
          UniswapV2Factory.bytecode,
          { types: ['address'], values: [account.address] },
        )

        // 3. Deploy UniswapV2Router02
        const routerAddr = await deployPrecompiled(
          vm,
          pk,
          UniswapV2Router02.bytecode,
          {
            types: ['address', 'address'],
            values: [factoryAddr.toString(), wethAddr.toString()],
          },
        )

        // 4. Deploy Token A (Yrd - basic SAO currency)
        const tokenA = await deployPrecompiled(vm, pk, ERC20Build.bytecode, {
          types: ['uint256'],
          values: [TOKEN_SUPPLY.toString()],
        })
        setTokenAAddress(tokenA)

        // 5. Deploy Token B (Col - advanced SAO currency)
        const tokenB = await deployPrecompiled(vm, pk, ERC20Build.bytecode, {
          types: ['uint256'],
          values: [TOKEN_SUPPLY.toString()],
        })
        setTokenBAddress(tokenB)

        // 6. Deploy student's TokenExchange contract
        const exchangeContract =
          compilerOutput.contracts['contract.sol']['TokenExchange']
        const exchangeAddr = await deployContract(
          vm,
          pk,
          exchangeContract.evm.bytecode.object,
          {
            types: ['address', 'address', 'address'],
            values: [
              routerAddr.toString(),
              tokenA.toString(),
              tokenB.toString(),
            ],
          },
        )
        setContractAddress(exchangeAddr)

        console.log('All contracts deployed successfully')
        console.log('Router:', routerAddr.toString())
        console.log('Token A (Yrd):', tokenA.toString())
        console.log('Token B (Col):', tokenB.toString())
        console.log('TokenExchange:', exchangeAddr.toString())
      } catch (error) {
        console.error('Deployment error:', error)
        showMessage(
          'Deployment Error',
          'Failed to deploy contracts. Check console for details.',
        )
      } finally {
        setIsDeploying(false)
      }
    }

    setup()
  }, [compilerOutput, account, vm])

  // Refresh balances and prices when contracts are deployed
  useEffect(() => {
    refreshBalances()
    refreshPrices()
  }, [contractAddress, tokenAAddress, tokenBAddress, vm, account])

  const addLiquidity = async () => {
    if (
      !vm ||
      !account ||
      !contractAddress ||
      !tokenAAddress ||
      !tokenBAddress ||
      !liquidityAmountA ||
      !liquidityAmountB
    )
      return

    try {
      const pk = hexToBytes(account.privateKey)
      const amountA = BigInt(liquidityAmountA)
      const amountB = BigInt(liquidityAmountB)

      // Approve TokenExchange to spend tokenA
      await callFunction(vm, pk, tokenAAddress, 'approve', {
        types: ['address', 'uint256'],
        values: [contractAddress.toString(), amountA.toString()],
      })

      // Approve TokenExchange to spend tokenB
      await callFunction(vm, pk, tokenBAddress, 'approve', {
        types: ['address', 'uint256'],
        values: [contractAddress.toString(), amountB.toString()],
      })

      // Call addLiquidity on student's contract
      await callFunction(vm, pk, contractAddress, 'addLiquidity', {
        types: ['uint256', 'uint256'],
        values: [amountA.toString(), amountB.toString()],
      })

      await refreshBalances()
      await refreshPrices()
      setLiquidityAmountA('')
      setLiquidityAmountB('')
      showMessage(
        'Liquidity Added!',
        `Successfully added ${liquidityAmountA} Yrd and ${liquidityAmountB} Col to the pool.`,
      )
    } catch (error: any) {
      console.error('Error adding liquidity:', error)
      showMessage('Error', error.message || 'Failed to add liquidity.')
    }
  }

  const swapTokens = async () => {
    if (
      !vm ||
      !account ||
      !contractAddress ||
      !tokenAAddress ||
      !tokenBAddress ||
      !swapAmount
    )
      return

    try {
      const pk = hexToBytes(account.privateKey)
      const amount = BigInt(swapAmount)
      const tokenIn =
        swapDirection === 'AtoB' ? tokenAAddress : tokenBAddress

      // Approve TokenExchange to spend the input token
      await callFunction(vm, pk, tokenIn, 'approve', {
        types: ['address', 'uint256'],
        values: [contractAddress.toString(), amount.toString()],
      })

      // Call swapTokens on student's contract
      await callFunction(vm, pk, contractAddress, 'swapTokens', {
        types: ['address', 'uint256', 'uint256'],
        values: [tokenIn.toString(), amount.toString(), '0'],
      })

      await refreshBalances()
      await refreshPrices()
      setSwapAmount('')
      const fromToken = swapDirection === 'AtoB' ? 'Yrd' : 'Col'
      const toToken = swapDirection === 'AtoB' ? 'Col' : 'Yrd'
      showMessage(
        'Swap Complete!',
        `Swapped ${swapAmount} ${fromToken} for ${toToken}.`,
      )
    } catch (error: any) {
      console.error('Error swapping tokens:', error)
      showMessage('Error', error.message || 'Failed to swap tokens.')
    }
  }

  return (
    <div
      className={`h-[1000px] overflow-y-scroll rounded-2xl bg-gray-900 p-4 ${font.className}`}
    >
      <div className="container relative mx-auto">
        <h1 className="pixel-text mb-6 text-center text-4xl font-bold text-yellow-400">
          Aincrad Token Exchange
        </h1>

        {/* Status */}
        <div className="wooden-frame mb-4 p-4">
          <h2 className="pixel-text mt-0! mb-2 text-2xl text-yellow-400">
            Status
          </h2>
          <p className="pixel-text text-sm">
            {isDeploying
              ? '⏳ Deploying contracts...'
              : contractAddress
                ? '✅ Exchange ready'
                : '⚠️ Compile your contract to begin'}
          </p>
          {contractAddress && (
            <>
              <p className="pixel-text mt-2 text-sm">
                Yrd Balance: {balanceA}
              </p>
              <p className="pixel-text text-sm">
                Col Balance: {balanceB}
              </p>
            </>
          )}
        </div>

        {/* Token Prices */}
        {contractAddress && (
          <div className="wooden-frame mb-4 p-4">
            <h2 className="pixel-text mt-0! mb-2 text-2xl text-yellow-400">
              Token Prices
            </h2>
            <p className="pixel-text mb-1 text-sm">
              1 Yrd = {priceAtoB} Col
            </p>
            <p className="pixel-text mb-1 text-sm">
              1 Col = {priceBtoA} Yrd
            </p>
            <p className="pixel-text mb-1 text-sm">
              1 Yrd = {priceAtoEth} wei
            </p>
            <p className="pixel-text text-sm">
              1 Col = {priceBtoEth} wei
            </p>
            <Button
              onClick={refreshPrices}
              className="pixel-button mt-2"
              disabled={isCompiling || isDeploying}
            >
              Refresh Prices
            </Button>
          </div>
        )}

        {/* Add Liquidity */}
        <div className="wooden-frame mb-4 p-4">
          <h2 className="pixel-text mt-0! mb-2 text-2xl text-yellow-400">
            Add Liquidity
          </h2>
          <p className="pixel-text mb-2 text-sm">
            Provide both Yrd and Col tokens to create a trading pool.
          </p>
          <div className="mb-2">
            <Label htmlFor="liquidityA" className="pixel-text text-white">
              Yrd Amount
            </Label>
            <Input
              id="liquidityA"
              type="number"
              value={liquidityAmountA}
              onChange={(e) => setLiquidityAmountA(e.target.value)}
              placeholder="Amount of Yrd tokens"
              className="pixel-input bg-white"
            />
          </div>
          <div className="mb-2">
            <Label htmlFor="liquidityB" className="pixel-text text-white">
              Col Amount
            </Label>
            <Input
              id="liquidityB"
              type="number"
              value={liquidityAmountB}
              onChange={(e) => setLiquidityAmountB(e.target.value)}
              placeholder="Amount of Col tokens"
              className="pixel-input bg-white"
            />
          </div>
          <Button
            onClick={addLiquidity}
            className="pixel-button"
            disabled={isCompiling || !contractAddress || isDeploying}
          >
            Add Liquidity
          </Button>
        </div>

        {/* Swap Tokens */}
        <div className="wooden-frame mb-4 p-4">
          <h2 className="pixel-text mt-0! mb-2 text-2xl text-yellow-400">
            Swap Tokens
          </h2>
          <p className="pixel-text mb-2 text-sm">
            Swap between Yrd and Col using the Uniswap V2 exchange.
          </p>
          <div className="mb-2">
            <button
              onClick={() => setSwapDirection('AtoB')}
              className={`pixel-button mr-2 ${swapDirection === 'AtoB' ? 'active' : ''}`}
            >
              Yrd → Col
            </button>
            <button
              onClick={() => setSwapDirection('BtoA')}
              className={`pixel-button ${swapDirection === 'BtoA' ? 'active' : ''}`}
            >
              Col → Yrd
            </button>
          </div>
          <div className="mb-2">
            <Label htmlFor="swapAmount" className="pixel-text text-white">
              {swapDirection === 'AtoB' ? 'Yrd' : 'Col'} Amount
            </Label>
            <Input
              id="swapAmount"
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder={`Amount of ${swapDirection === 'AtoB' ? 'Yrd' : 'Col'} to swap`}
              className="pixel-input bg-white"
            />
          </div>
          <Button
            onClick={swapTokens}
            className="pixel-button"
            disabled={isCompiling || !contractAddress || isDeploying}
          >
            Swap
          </Button>
        </div>

        {showDialog && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="wooden-frame w-full max-w-sm p-4">
              <h2 className="pixel-text mb-2 text-2xl">
                {dialogContent.title}
              </h2>
              <p className="pixel-text mb-4">{dialogContent.content}</p>
              <Button
                onClick={() => setShowDialog(false)}
                className="pixel-button"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function getBalance(
  vm: VM,
  tokenAddress: Address,
  ownerAddress: string,
  iface: Interface,
): Promise<string> {
  const data = iface.encodeFunctionData('balanceOf', [ownerAddress])
  const result = await vm.evm.runCall({
    to: tokenAddress,
    data: hexToBytes(data as `0x${string}`),
  })
  if (result.execResult.exceptionError) return '0'
  const decoded = iface.decodeFunctionResult(
    'balanceOf',
    bytesToHex(result.execResult.returnValue),
  )
  return decoded[0].toString()
}
