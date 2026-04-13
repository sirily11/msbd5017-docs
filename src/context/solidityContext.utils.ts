import { Interface, defaultAbiCoder as AbiCoder } from '@ethersproject/abi'
import {
  AccessListEIP2930TxData,
  FeeMarketEIP1559TxData,
  LegacyTransaction,
  TxData,
} from '@ethereumjs/tx'
import { Account, Address } from '@ethereumjs/util'
import { VM } from '@ethereumjs/vm'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { Block } from '@ethereumjs/block'

type TransactionsData =
  | TxData
  | AccessListEIP2930TxData
  | FeeMarketEIP1559TxData

export const encodeFunction = (
  method: string,
  params?: {
    types: any[]
    values: unknown[]
  },
): string => {
  const parameters = params?.types ?? []
  const methodWithParameters = `function ${method}(${parameters.join(',')})`
  const signatureHash = new Interface([methodWithParameters]).getSighash(method)
  const encodedArgs = AbiCoder.encode(parameters, params?.values ?? [])

  return signatureHash + encodedArgs.slice(2)
}

export const encodeDeployment = (
  bytecode: string,
  params?: {
    types: any[]
    values: unknown[]
  },
) => {
  const deploymentData = '0x' + bytecode
  if (params) {
    const argumentsEncoded = AbiCoder.encode(params.types, params.values)
    return deploymentData + argumentsEncoded.slice(2)
  }
  return deploymentData
}

export const buildTransaction = (
  data: Partial<TransactionsData>,
): TransactionsData => {
  const defaultData: Partial<TransactionsData> = {
    nonce: BigInt(0),
    gasLimit: 2_000_000, // We assume that 2M is enough,
    gasPrice: 1,
    value: 0,
    data: '0x',
  }

  return {
    ...defaultData,
    ...data,
  }
}

/**
 *  Insert an account into the VM
 *  With a balance of 2000 ETH
 * @param vm
 * @param address
 */
export const insertAccount = async (vm: VM, address: Address) => {
  const acctData = {
    nonce: 0,
    balance: BigInt(2000) ** BigInt(18), // 2000 ETH
  }
  const account = Account.fromAccountData(acctData)

  await vm.stateManager.putAccount(address, account)
}

export const getAccountNonce = async (
  vm: VM,
  accountPrivateKey: Uint8Array,
) => {
  const address = Address.fromPrivateKey(accountPrivateKey)
  const account = await vm.stateManager.getAccount(address)
  if (account) {
    return account.nonce
  } else {
    return BigInt(0)
  }
}

/**
 *  Deploy a contract
 * @param vm EthereumJS VM
 * @param senderPrivateKey  Private key of the sender
 * @param deploymentBytecode Bytecode of the contract to deploy
 * @returns
 */
export async function deployContract(
  vm: VM,
  senderPrivateKey: Uint8Array,
  deploymentBytecode: string,
  params?: {
    types: any[]
    values: unknown[]
  },
  gasLimit?: number,
): Promise<Address> {
  // Contracts are deployed by sending their deployment bytecode to the address 0
  // The contract params should be abi-encoded and appended to the deployment bytecode.

  const data = encodeDeployment(deploymentBytecode, params)
  const txData = {
    data,
    nonce: await getAccountNonce(vm, senderPrivateKey),
    ...(gasLimit ? { gasLimit } : {}),
  }

  const tx = LegacyTransaction.fromTxData(
    buildTransaction(txData as any) as any,
    {
      common,
    },
  ).sign(senderPrivateKey)

  const deploymentResult = await vm.runTx({ tx, block: block })

  if (deploymentResult.execResult.exceptionError) {
    throw deploymentResult.execResult.exceptionError
  }

  return deploymentResult.createdAddress!
}

export const common = new Common({
  chain: Chain.Mainnet,
  hardfork: Hardfork.Istanbul,
})
export const block = Block.fromBlockData(
  { header: { extraData: new Uint8Array(97) } },
  { common },
)

import { defaultAbiCoder } from '@ethersproject/abi'

export function decodeRevertMessage(returnValue: Uint8Array): string {
  if (returnValue.length === 0) {
    return 'Transaction reverted without a reason'
  }

  // Convert Uint8Array to hex string
  const hexString =
    '0x' +
    Array.from(returnValue)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

  // Check if it's a standard revert message (Error(string))
  if (hexString.slice(2, 10) === '08c379a0') {
    // Remove the function selector
    const encodedReason = '0x' + hexString.slice(10)
    const [decodedReason] = defaultAbiCoder.decode(['string'], encodedReason)
    return `Transaction reverted with reason: ${decodedReason}`
  }

  // It might be a custom error, try to decode it as a string
  try {
    const [decodedReason] = defaultAbiCoder.decode(['string'], hexString)
    return `Transaction reverted with custom error: ${decodedReason}`
  } catch (decodeError) {
    return `Failed to decode revert reason. Raw data: ${hexString}`
  }
}
