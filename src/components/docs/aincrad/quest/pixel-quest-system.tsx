'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pixelify_Sans } from 'next/font/google'
import { useSolidity } from '@/context/solidityContext'
import { VM } from '@ethereumjs/vm'
import { Address, bytesToHex, hexToBytes, zeroAddress } from '@ethereumjs/util'
import {
  buildTransaction,
  decodeRevertMessage,
  deployContract,
  encodeFunction,
  getAccountNonce,
  insertAccount,
} from '@/context/solidityContext.utils'
import { CompilerOutput } from '@/lib/interfaces'
import { HDNodeWallet } from 'ethers'
import { Interface } from '@ethersproject/abi'
import { LegacyTransaction } from '@ethereumjs/tx'
import './style.css'
import { Log } from '@ethereumjs/evm'

const font = Pixelify_Sans({
  subsets: ['latin'],
})

type Quest = {
  id: number
  description: string
  reward: number
  completed: boolean
  verified: boolean
  completer: string
  creator: string
}

async function deployQuestContract(
  vm: VM,
  compilerOutput: CompilerOutput,
  privateKey: Uint8Array,
  takerAddress: Address,
) {
  const questContract = compilerOutput.contracts['contract.sol']['QuestSystem']
  const deploymentBytecode = questContract.evm.bytecode.object
  await insertAccount(vm, takerAddress)
  return await deployContract(vm, privateKey, deploymentBytecode, {
    types: [],
    values: [],
  })
}

export default function PixelQuestSystemComponent() {
  const { compilerOutput, isCompiling, vm, account } = useSolidity()
  const [quests, setQuests] = useState<Quest[]>([])
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [currentUser, setCurrentUser] = useState('Creator')
  const [showDialog, setShowDialog] = useState(false)
  const [dialogContent, setDialogContent] = useState({ title: '', content: '' })
  const [contractAddress, setContractAddress] = useState<Address | null>(null)
  const [questTakerAccount] = useState(() => HDNodeWallet.createRandom())

  useEffect(() => {
    if (!vm) return
    if (!contractAddress) return
    const events = vm.events.on('afterTx', async (event) => {
      const logs = event.receipt.logs
      processLogs(logs)
    })

    return () => {
      events.removeAllListeners()
    }
  }, [vm, compilerOutput, contractAddress])

  // Deploy contract when compiler output changes
  useEffect(() => {
    if (!compilerOutput || !account || !vm) return

    const deployContract = async () => {
      try {
        const address = await deployQuestContract(
          vm,
          compilerOutput,
          hexToBytes(account.privateKey),
          Address.fromString(questTakerAccount.address),
        )
        setContractAddress(address)
        console.log('Contract deployed at:', address.toString())
      } catch (error) {
        console.error('Error deploying contract:', error)
      }
    }

    deployContract().then(() => {
      setQuests([])
    })
  }, [compilerOutput, account, vm])

  const processLogs = (logs: Log[]) => {
    if (!compilerOutput) return

    const contractABI =
      compilerOutput.contracts['contract.sol']['QuestSystem'].abi
    const iface = new Interface(contractABI)

    logs.forEach((log) => {
      const [logAddress, logTopics, logData] = log
      const logAddressStr = bytesToHex(logAddress)

      if (
        contractAddress &&
        Address.fromString(logAddressStr).equals(contractAddress)
      ) {
        try {
          const event = iface.parseLog({
            topics: logTopics.map(
              (t: Uint8Array) => '0x' + Buffer.from(t).toString('hex'),
            ),
            data: '0x' + Buffer.from(logData).toString('hex'),
          })

          switch (event.name) {
            case 'QuestCreated':
              const { id, creator, quest } = event.args
              setQuests((prev) => [
                ...prev,
                {
                  id: Number(id),
                  description: quest.description,
                  reward: Number(quest.reward),
                  completed: quest.completed,
                  verified: quest.verified,
                  completer: quest.completer,
                  creator: creator,
                },
              ])
              break

            case 'QuestTaken':
              const { id: takenId, taker } = event.args
              setQuests((prev) =>
                prev.map((q) =>
                  q.id === Number(takenId) ? { ...q, completer: taker } : q,
                ),
              )
              break

            case 'QuestCompleted':
              const { id: completedId } = event.args
              setQuests((prev) =>
                prev.map((q) =>
                  q.id === Number(completedId) ? { ...q, completed: true } : q,
                ),
              )
              break

            case 'QuestVerified':
              const { id: verifiedId } = event.args
              setQuests((prev) =>
                prev.map((q) =>
                  q.id === Number(verifiedId) ? { ...q, verified: true } : q,
                ),
              )
              break
          }
        } catch (error) {
          console.error('Error parsing log:', error)
        }
      }
    })
  }

  const createQuest = async () => {
    if (!vm || !account || !contractAddress || !description || !reward) return

    try {
      const data = encodeFunction('createQuest', {
        types: ['tuple(string,uint256,bool,bool,address)'],
        values: [
          [
            description,
            reward,
            false,
            false,
            '0x0000000000000000000000000000000000000000',
          ],
        ],
      })

      // Convert the reward value to a 0x-prefixed hex string
      const hexReward = `0x${BigInt(reward).toString(16)}`

      const txData = {
        to: contractAddress,
        data,
        value: hexReward, // Now using the properly formatted hex string
        nonce: await getAccountNonce(vm, hexToBytes(account.privateKey)),
      }

      const tx = LegacyTransaction.fromTxData(
        buildTransaction(txData as any) as any,
        {
          common: vm.common,
        },
      ).sign(hexToBytes(account.privateKey))

      const result = await vm.runTx({ tx })
      if (result.execResult.exceptionError) {
        const message = decodeRevertMessage(result.execResult.returnValue)
        setDialogContent({
          title: 'Error',
          content: message,
        })
        setShowDialog(true)
        return
      }

      setDescription('')
      setReward('')
      setDialogContent({
        title: 'Quest Created!',
        content: 'Your quest has been added to the board.',
      })
      setShowDialog(true)
    } catch (error) {
      console.error('Error creating quest:', error)
      setDialogContent({
        title: 'Error',
        content: 'Failed to create quest. Please try again.',
      })
      setShowDialog(true)
    }
  }

  const takeQuest = async (quest: Quest) => {
    if (!vm || !contractAddress) return

    try {
      const data = encodeFunction('takeQuest', {
        types: ['uint256'],
        values: [quest.id],
      })

      const txData = {
        to: contractAddress,
        data,
        nonce: await getAccountNonce(
          vm,
          hexToBytes(questTakerAccount.privateKey),
        ),
      }

      const tx = LegacyTransaction.fromTxData(
        buildTransaction(txData as any) as any,
        {
          common: vm.common,
        },
      ).sign(hexToBytes(questTakerAccount.privateKey))

      const result = await vm.runTx({ tx })
      if (result.execResult.exceptionError) {
        const message = decodeRevertMessage(result.execResult.returnValue)
        setDialogContent({
          title: 'Error',
          content: message,
        })
        setShowDialog(true)
        return
      }

      setDialogContent({
        title: 'Quest Accepted!',
        content: 'Good luck on your adventure!',
      })
      setShowDialog(true)
    } catch (error) {
      console.error('Error taking quest:', error)
      setDialogContent({
        title: 'Error',
        content: 'Failed to take quest. Please try again.',
      })
      setShowDialog(true)
    }
  }

  const completeQuest = async (quest: Quest) => {
    if (!vm || !contractAddress) return

    try {
      const data = encodeFunction('completeQuest', {
        types: [],
        values: [],
      })

      const txData = {
        to: contractAddress,
        data,
        nonce: await getAccountNonce(
          vm,
          hexToBytes(questTakerAccount.privateKey),
        ),
      }

      const tx = LegacyTransaction.fromTxData(
        buildTransaction(txData as any) as any,
        {
          common: vm.common,
        },
      ).sign(hexToBytes(questTakerAccount.privateKey))

      const result = await vm.runTx({ tx })
      if (result.execResult.exceptionError) {
        const message = decodeRevertMessage(result.execResult.returnValue)
        setDialogContent({
          title: 'Error',
          content: message,
        })
        setShowDialog(true)
        return
      }

      setDialogContent({
        title: 'Quest Completed!',
        content: 'Well done, brave adventurer!',
      })
      setShowDialog(true)
    } catch (error) {
      console.error('Error completing quest:', error)
      setDialogContent({
        title: 'Error',
        content: 'Failed to complete quest. Please try again.',
      })
      setShowDialog(true)
    }
  }

  const verifyQuest = async (quest: Quest) => {
    if (!vm || !account || !contractAddress) return

    try {
      const data = encodeFunction('verifyComplete', {
        types: [],
        values: [],
      })

      const txData = {
        to: contractAddress,
        data,
        nonce: await getAccountNonce(vm, hexToBytes(account.privateKey)),
      }

      const tx = LegacyTransaction.fromTxData(
        buildTransaction(txData as any) as any,
        {
          common: vm.common,
        },
      ).sign(hexToBytes(account.privateKey))

      const result = await vm.runTx({ tx })
      if (result.execResult.exceptionError) {
        const message = decodeRevertMessage(result.execResult.returnValue)
        setDialogContent({
          title: 'Error',
          content: message,
        })
        setShowDialog(true)
        return
      }

      setDialogContent({
        title: 'Quest Verified!',
        content: 'The rewards have been distributed.',
      })
      setShowDialog(true)
    } catch (error) {
      console.error('Error verifying quest:', error)
      setDialogContent({
        title: 'Error',
        content: 'Failed to verify quest. Please try again.',
      })
      setShowDialog(true)
    }
  }

  return (
    <div
      className={`h-[1000px] overflow-y-scroll rounded-2xl bg-gray-900 p-4 ${font.className}`}
    >
      <div className="container relative mx-auto">
        <h1
          className={`pixel-text mb-6 text-center text-4xl font-bold text-yellow-400`}
        >
          Sword Art Online
        </h1>

        <div className="wooden-frame sticky top-0 mb-4 p-4">
          <button
            onClick={() => setCurrentUser('Creator')}
            className={`pixel-button mr-2 ${currentUser === 'Creator' ? 'active' : ''}`}
          >
            Quest Creator ({account?.address.slice(0, 6)}...)
          </button>
          <button
            onClick={() => setCurrentUser('Taker')}
            className={`pixel-button ${currentUser === 'Taker' ? 'active' : ''}`}
          >
            Quest Taker ({questTakerAccount.address.slice(0, 6)}...)
          </button>
        </div>

        {currentUser === 'Creator' && (
          <div className="wooden-frame mb-4 p-4">
            <h2 className="pixel-text mt-0! mb-2 text-2xl text-yellow-400">
              Forge a New Quest
            </h2>
            <div className="mb-2">
              <Label htmlFor="description" className="pixel-text text-white">
                Quest Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quest description"
                className="pixel-input bg-white"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="reward" className="pixel-text text-white">
                Reward (in wei)
              </Label>
              <Input
                id="reward"
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="Enter reward amount"
                className="pixel-input bg-white"
              />
            </div>
            <Button
              onClick={createQuest}
              className="pixel-button"
              disabled={isCompiling || !contractAddress}
            >
              Forge Quest
            </Button>
          </div>
        )}

        <div className="wooden-frame p-4">
          <h2 className="pixel-text mt-0! mb-2 text-2xl">
            {currentUser === 'Creator'
              ? 'Your Legendary Quests'
              : 'Available Quests'}
          </h2>
          <div className="grid gap-4">
            {quests.map((quest) => (
              <div key={quest.id} className="pixel-card">
                <h3 className="pixel-text font-bold">{quest.description}</h3>
                <p className="pixel-text font-semibold">
                  Reward: {quest.reward} Wei
                </p>
                <p className="pixel-text font-semibold">
                  Status:{' '}
                  {quest.completed
                    ? quest.verified
                      ? 'Verified'
                      : 'Completed'
                    : quest.completer !== zeroAddress()
                      ? 'In Progress'
                      : 'Open'}
                </p>
                {currentUser === 'Creator' &&
                  quest.completed &&
                  !quest.verified && (
                    <Button
                      onClick={() => verifyQuest(quest)}
                      className="pixel-button mt-2"
                      disabled={isCompiling || !contractAddress}
                    >
                      Verify Quest
                    </Button>
                  )}
                {currentUser === 'Taker' &&
                  !quest.completed &&
                  quest.completer !== questTakerAccount.address && (
                    <Button
                      onClick={() => takeQuest(quest)}
                      className="pixel-button mt-2"
                      disabled={isCompiling || !contractAddress}
                    >
                      Embark on Quest
                    </Button>
                  )}
                {currentUser === 'Taker' &&
                  quest.completer === questTakerAccount.address &&
                  !quest.completed && (
                    <Button
                      onClick={() => completeQuest(quest)}
                      className="pixel-button mt-2"
                      disabled={isCompiling || !contractAddress}
                    >
                      Complete Quest
                    </Button>
                  )}
              </div>
            ))}
          </div>
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
