'use server'
import { CompilerOutput } from '@/lib/interfaces'
import { ethers } from 'ethers'
import { cookies } from 'next/headers'
//@ts-expect-error
import solc from 'solc'
import fs from 'fs'
import path from 'path'

const SessionKey = 'session'

export async function compile(
  sourceCode: string,
): Promise<CompilerOutput | { error: string }> {
  try {
    const fileName = 'contract.sol'

    const input = {
      language: 'Solidity',
      sources: {
        [fileName]: {
          content: sourceCode,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    }

    const output = solc.compile(JSON.stringify(input), {
      import: (url: string) => {
        const searchPaths = [
          path.join(process.cwd(), 'node_modules', url),
          path.join(process.cwd(), 'src', 'contracts', url),
        ]
        for (const filePath of searchPaths) {
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8')
            return { contents: content }
          }
        }
        return { error: `File not found: ${url}` }
      },
    })
    const result = JSON.parse(output)
    const contracts = result.contracts as
      | {
          [fileName: string]: {
            [contractName: string]: {
              abi: any[]
              evm: {
                bytecode: {
                  object: string
                }
              }
            }
          }
        }
      | undefined

    if (contracts === undefined) {
      return {
        ...result,
      }
    }
    const allabis = Object.entries(contracts).flatMap(
      ([fileName, fileContracts]) =>
        Object.entries(fileContracts).flatMap(([contractName, contractData]) =>
          contractData.abi.map((abiItem) => ({
            ...abiItem,
            contractName,
            fileName,
          })),
        ),
    )
    return {
      ...result,
      abis: allabis,
    }
  } catch (error: any) {
    console.error(error)
    return {
      error: error.message,
    }
  }
}

export async function session() {
  const session = (await cookies()).get(SessionKey)

  return session?.value
    ? {
        ...JSON.parse(session.value),
        isAuth: true,
      }
    : { isAuth: false }
}

export async function signOut() {
  ;(await cookies()).delete(SessionKey)
}

export async function signIn(
  walletAddress: string,
  message: string,
  signature: string,
): Promise<{ error?: string }> {
  const signerAddress = ethers.verifyMessage(message, signature)
  if (signerAddress !== walletAddress) {
    return {
      error: 'Signature verification failed',
    }
  }

  ;(await cookies()).set(walletAddress, JSON.stringify({ isAuth: true }), {
    maxAge: 60, // 1 minute
  })
  return {}
}

export async function storeSession(walletAddress: string, session: any) {
  // check if session is valid
  if (!(await cookies()).has(walletAddress)) {
    return {
      error: 'Invalid session',
    }
  }

  const cookie = await cookies()
  cookie.delete(walletAddress)
  cookie.set(SessionKey, JSON.stringify(session), {
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
  return {}
}
