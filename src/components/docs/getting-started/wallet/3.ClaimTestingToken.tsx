'use client'
import { Button } from '@/components/shared/Button'
import { StepItemComponent } from '@/components/step-item'
import { axiomGemeni } from '@/lib/network'
import { useAddresses, useBalance, useWallet } from 'web3-connect-react'

const minimumBalance = 10

export default function ClaimTestingToken({ session }: { session?: any }) {
  const { chainId } = useWallet()
  const { addresses } = useAddresses('ethereum')
  const { balance } = useBalance('ethereum')
  const isAuth = session === undefined ? false : session.isAuth
  if (!isAuth) {
    return <></>
  }

  if (chainId !== axiomGemeni.chainId) {
    return <></>
  }

  if (!addresses) {
    return <></>
  }

  if (!balance) {
    return <></>
  }

  return (
    <StepItemComponent
      step={2}
      isDone={Number(balance[0]) > minimumBalance}
      isLast
    >
      {Number(balance) < minimumBalance ? (
        <div className="flex w-full flex-row items-center justify-between">
          <>
            <span className="max-w-2xl">
              Currently, you only have <b>{balance}</b> {axiomGemeni.symbol} in
              your wallet. Which is less than the minimum required balance of{' '}
              <b>{minimumBalance}</b> {axiomGemeni.symbol}. You can claim some{' '}
              {axiomGemeni.symbol} from the faucet.
            </span>
            <Button
              onClick={() => {
                window.open(
                  `https://faucet.gemini.axiomesh.io/home?address=${addresses[0]}`,
                  '_blank',
                )
              }}
            >
              Claim Token
            </Button>
          </>
        </div>
      ) : (
        <div>
          <span className="font-medium">
            You have more than {minimumBalance} {axiomGemeni.symbol} in your
            wallet. You are ready to start the tutorial.
          </span>
        </div>
      )}
    </StepItemComponent>
  )
}
