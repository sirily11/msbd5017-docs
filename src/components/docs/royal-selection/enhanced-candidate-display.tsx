'use client'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSolidity } from '@/context/solidityContext'
import {
  buildTransaction,
  common,
  decodeRevertMessage,
  deployContract,
  encodeFunction,
  getAccountNonce,
} from '@/context/solidityContext.utils'
import { Address, hexToBytes } from '@ethereumjs/util'
import { VM } from '@ethereumjs/vm'
import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'
import { LegacyTransaction } from '@ethereumjs/tx'
import Image from 'next/image'

type Candidate = {
  id: bigint
  votes: bigint
  name: string
  description: string
  imageUrl: string
}

const defaultCandidates: Candidate[] = [
  {
    id: BigInt(1),
    votes: BigInt(0),
    name: 'Emilia',
    description:
      'She is a half-elf and a candidate to become the 42nd king of the Dragon Kingdom of Lugunica in the Royal Selection.',
    imageUrl: '/images/royal-selection/Emilia.webp',
  },
  {
    id: BigInt(2),
    votes: BigInt(0),
    name: 'Felt',
    description:
      'Former thief and a candidate to become the 42nd king of Lugunica.',
    imageUrl: '/images/royal-selection/Felt.webp',
  },
  {
    id: BigInt(3),
    votes: BigInt(0),
    name: 'Crushch Karsten',
    description:
      'Former thief and a candidate to become the 42nd king of Lugunica.',
    imageUrl: '/images/royal-selection/Crusch_Karsten.webp',
  },
  {
    id: BigInt(4),
    votes: BigInt(0),
    name: 'Anastasia Hoshin',
    description: 'The Matriarch of House Karsten',
    imageUrl: '/images/royal-selection/Anastasia_Hoshin.webp',
  },
]

async function getAllCandidates(
  vm: VM,
  contractAddress: Address,
): Promise<Candidate[]> {
  const sigHash = new Interface(['function getAllCandidates()']).getSighash(
    'getAllCandidates',
  )
  const result = await vm.evm.runCall({
    to: contractAddress,
    data: hexToBytes(sigHash),
  })

  if (result.execResult.exceptionError) {
    const message = decodeRevertMessage(result.execResult.returnValue)
    throw new Error(message)
  }

  const resultData = AbiCoder.decode(
    [
      'tuple(uint256 id, uint256 votes, string name, string description, string imageUrl)[]',
    ],
    result.execResult.returnValue,
  )
  return resultData[0]
}

async function castVote(
  vm: VM,
  contractAddress: Address,
  privateKey: Uint8Array,
  candidateId: bigint,
) {
  const data = encodeFunction('castVote', {
    types: ['uint256'],
    values: [candidateId],
  })

  // send transaction to fill the bottle
  const txData = {
    to: contractAddress,
    data,
    nonce: await getAccountNonce(vm, privateKey),
  }

  const tx = LegacyTransaction.fromTxData(
    buildTransaction(txData as any) as any,
    {
      common: common,
    },
  ).sign(privateKey)

  const result = await vm.runTx({ tx })
  if (result.execResult.exceptionError) {
    const message = decodeRevertMessage(result.execResult.returnValue)
    throw new Error(message)
  }
}

export function EnhancedCandidateDisplay() {
  const { compilerOutput, isCompiling, vm, account } = useSolidity()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [contractAddress, setContractAddress] = useState<Address | null>(null)

  const totalVotes = useMemo(() => {
    let totalVotes = 0
    console.log(typeof totalVotes)
    for (let i = 0; i < candidates.length; i++) {
      totalVotes += Number(candidates[i].votes)
    }
    return totalVotes
  }, [candidates])

  useEffect(() => {
    if (!vm) return
    if (!contractAddress) return

    const promise = async () => {
      await getAllCandidates(vm, contractAddress)
        .then((candidates) => {
          setCandidates(candidates)
        })
        .catch((e: any) => {
          alert(`Cannot get candidates: ${e.error}`)
        })
    }

    promise()
  }, [contractAddress, vm])

  // deploy contract when compiler output is ready
  useEffect(() => {
    const promise = async () => {
      if (!compilerOutput) return
      if (!account) return
      if (!vm) return

      // deploy the contract
      const contract =
        compilerOutput.contracts['contract.sol']['RoyalSelection']
      const deploymentBytecode = contract.evm.bytecode.object

      const contractAddress = await deployContract(
        vm,
        hexToBytes(account.privateKey),
        deploymentBytecode,
        {
          types: [
            'tuple(uint256 id, uint256 votes, string name, string description, string imageUrl)[]',
            'uint256',
          ],
          // End time is 1 hour from now
          values: [defaultCandidates, BigInt(Date.now() + 1000 * 60 * 60)],
        },
      )

      setContractAddress(contractAddress)
    }

    promise()
  }, [compilerOutput, account, vm])

  const vote = useCallback(
    async (candidateId: bigint) => {
      try {
        if (!vm) return
        if (!account) return
        if (!contractAddress) return

        await castVote(
          vm,
          contractAddress,
          hexToBytes(account.privateKey),
          candidateId,
        )

        // update candidates
        const candidates = await getAllCandidates(vm, contractAddress).catch(
          (e: any) => {
            alert(e.message)
            throw e
          },
        )
        setCandidates(candidates)
      } catch (e: any) {
        alert(e.message)
      }
    },
    [vm, account, contractAddress],
  )

  return (
    <div className="container mx-auto h-[1000px] overflow-y-scroll rounded-2xl border">
      <h1 className="sticky top-0 mb-1 bg-background p-2 text-2xl font-bold">
        Candidate List
      </h1>
      <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-2">
        {candidates.map((candidate, index) => (
          <Card
            key={candidate.id}
            className={`col-span-full flex flex-col ${index === 0 ? 'sticky top-10 bg-linear-to-r from-blue-50 to-purple-50 lg:col-span-2 dark:from-blue-900 dark:to-purple-900' : ''}`}
          >
            <CardHeader>
              {index === 0 && (
                <Badge className="bg-linear-to-r from-fuchsia-600 to-purple-600">
                  Editor's Choice
                </Badge>
              )}
              <div className="flex flex-wrap items-center space-x-4">
                <Image
                  src={candidate.imageUrl}
                  alt={candidate.name}
                  className="h-24 w-24 rounded-full object-cover"
                  height={512}
                  width={512}
                />
                <div>
                  <CardTitle className={index === 0 ? 'text-2xl' : 'text-xl'}>
                    {candidate.name}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grow">
              <p
                className={`mb-4 text-sm text-muted-foreground ${index === 0 ? 'text-base' : ''}`}
              >
                {candidate.description}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    ID: {Number(candidate.id)}
                  </span>
                  <span className="text-sm font-semibold">
                    Votes: {Number(candidate.votes)}
                  </span>
                </div>
                {index === 0 && (
                  <>
                    <Progress
                      value={(Number(candidate.votes) / totalVotes) * 100}
                      className="h-2"
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {((Number(candidate.votes) / totalVotes) * 100).toFixed(
                        2,
                      )}
                      % of total votes
                    </p>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={isCompiling}
                onClick={() => vote(candidate.id)}
              >
                Vote for {candidate.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
