import { VM } from '@ethereumjs/vm'
import { Account, Address } from '@ethereumjs/util'
import { Chain, Common } from '@ethereumjs/common'
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { Block } from '@ethereumjs/block'
import { Log } from '@ethereumjs/evm'
import { AfterBlockEvent } from '@ethereumjs/vm'

// Sample contract ABI for the event we want to listen to
const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
]

async function setupVM() {
  const common = new Common({ chain: Chain.Mainnet })
  const vm = await VM.create({ common })
  return vm
}

async function deployContract(vm: VM, bytecode: Buffer) {
  const address = Address.fromString(
    '0x1234567890123456789012345678901234567890',
  )
  const account = Account.fromAccountData({ nonce: 0, balance: 10000000n })

  await vm.stateManager.putAccount(address, account)

  const tx = FeeMarketEIP1559Transaction.fromTxData({
    nonce: 0n,
    gasLimit: 2000000n,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
    data: bytecode,
    value: 0n,
    chainId: 1n,
  })

  const deployResult = await vm.runTx({ tx })

  if (!deployResult.createdAddress) {
    throw new Error('Contract deployment failed')
  }

  return deployResult.createdAddress
}

async function listenToEvents(vm: VM, contractAddress: Address) {
  const stateManager = vm.stateManager as DefaultStateManager

  // Function to process logs
  const processLogs = (logs: Log[]) => {
    logs.forEach((log) => {
      // log is a tuple of [address, topics, data]
      const [logAddress, logTopics, logData] = log

      // Convert the log address to Address instance for comparison
      const logAddressStr = Buffer.from(logAddress).toString('hex')
      if (Address.fromString(`0x${logAddressStr}`).equals(contractAddress)) {
        const event = decodeEventLog(CONTRACT_ABI[0], log)
        console.log('Event detected:', {
          name: 'Transfer',
          from: event.args.from,
          to: event.args.to,
          value: event.args.value.toString(),
        })
      }
    })
  }

  // Subscribe to new blocks
  vm.events.on('afterBlock', async (event: AfterBlockEvent) => {
    const { block } = event
    const receipts = await vm.runBlock({ block })
    receipts.receipts.forEach((receipt) => {
      if (receipt.logs && receipt.logs.length > 0) {
        processLogs(receipt.logs)
      }
    })
  })
}

// Helper function to decode event logs
function decodeEventLog(eventABI: any, log: Log) {
  // Destructure the log tuple
  const [_, topics, data] = log

  // Convert topics (Uint8Array) to hex strings and then to Addresses
  const fromTopic = Buffer.from(topics[1]).toString('hex')
  const toTopic = Buffer.from(topics[2]).toString('hex')

  return {
    args: {
      from: Address.fromString(`0x${fromTopic}`),
      to: Address.fromString(`0x${toTopic}`),
      value: BigInt('0x' + Buffer.from(data).toString('hex')),
    },
  }
}
