'use client'

import { Button } from '@/components/ui/button'
import { useSolidity } from '@/context/solidityContext'
import {
  decodeRevertMessage,
  deployContract,
} from '@/context/solidityContext.utils'
import { trackCodeExecution } from '@/lib/analytics'
import { Address, hexToBytes } from '@ethereumjs/util'
import { VM } from '@ethereumjs/vm'
import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'

async function callHello(
  vm: VM,
  contractAddress: Address,
  caller: Address,
  abi: any[],
) {
  const sigHash = new Interface(['function hello()']).getSighash('hello')
  const result = await vm.evm.runCall({
    caller,
    to: contractAddress,
    origin: caller,
    data: hexToBytes(sigHash),
  })

  if (result.execResult.exceptionError) {
    const message = decodeRevertMessage(result.execResult.returnValue)
    throw new Error(message)
  }

  const resultData = AbiCoder.decode(['string'], result.execResult.returnValue)
  return resultData[0]
}

export default function Example1Executor() {
  const { compilerOutput, account, vm, isCompiling } = useSolidity()
  const [result, setResult] = useState<string | null>(null)
  const [previousResult, setPreviousResult] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [highlightedText, setHighlightedText] = useState('')
  const [shouldAnimate, setShouldAnimate] = useState(false)

  const deployAndRun = useCallback(async () => {
    setIsRunning(true)
    setShouldAnimate(false)
    const startTime = performance.now()

    try {
      if (compilerOutput === null || !account || !vm) {
        return
      }

      const contract = compilerOutput.contracts['contract.sol']['HelloWorld']
      const abi = contract.abi
      const deploymentBytecode = contract.evm.bytecode.object

      const contractAddress = await deployContract(
        vm,
        hexToBytes(account.privateKey),
        deploymentBytecode,
      )
      const newResult = await callHello(
        vm,
        contractAddress,
        Address.fromPrivateKey(hexToBytes(account.privateKey)),
        abi,
      ).catch((e) => {
        alert(e.message)
        return null
      })
      setPreviousResult(result)
      setResult(newResult)
      trackCodeExecution('HelloWorld', performance.now() - startTime, true)
    } catch (e: any) {
      trackCodeExecution('HelloWorld', performance.now() - startTime, false)
      alert(e.message)
    } finally {
      setIsRunning(false)
      setShouldAnimate(true)
    }
  }, [compilerOutput, account, vm, result])

  useEffect(() => {
    if (shouldAnimate && result) {
      const animateText = async () => {
        if (!previousResult) {
          // If there's no previous result, just type out the new result without highlighting
          for (let i = 0; i <= result.length; i++) {
            setDisplayText(result.slice(0, i))
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          setHighlightedText('')
        } else {
          // Find the common prefix
          let commonPrefixLength = 0
          while (
            commonPrefixLength < previousResult.length &&
            commonPrefixLength < result.length &&
            previousResult[commonPrefixLength] === result[commonPrefixLength]
          ) {
            commonPrefixLength++
          }

          // Erase the different part from the end
          for (let i = previousResult.length; i > commonPrefixLength; i--) {
            setDisplayText(previousResult.slice(0, i))
            await new Promise((resolve) => setTimeout(resolve, 50))
          }

          // Type the new part
          for (let i = commonPrefixLength; i <= result.length; i++) {
            setDisplayText(result.slice(0, i))
            setHighlightedText(result.slice(commonPrefixLength, i))
            await new Promise((resolve) => setTimeout(resolve, 50))
          }

          // Clear the highlight after a short delay
          await new Promise((resolve) => setTimeout(resolve, 500))
          setHighlightedText('')
        }
      }
      animateText()
    }
  }, [shouldAnimate, result, previousResult])

  if (compilerOutput === null) {
    return null
  }

  return (
    <div className="mt-2 flex h-20 flex-row items-center justify-between rounded-2xl border p-5 text-lg font-medium">
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {isRunning ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Loader2 className="h-6 w-6 animate-spin" />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <span className="font-bold">Smart contract says</span>:{' '}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                {displayText.slice(
                  0,
                  displayText.length - highlightedText.length,
                )}
                {highlightedText && (
                  <span className="bg-yellow-200">{highlightedText}</span>
                )}
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="instruction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              Click the button to deploy and run the contract
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <Button onClick={deployAndRun} disabled={isCompiling || isRunning}>
          Say Hello
        </Button>
      </div>
    </div>
  )
}
