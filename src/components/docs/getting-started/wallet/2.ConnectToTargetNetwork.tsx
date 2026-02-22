'use client'
import { Button } from '@/components/shared/Button'
import { StepItemComponent } from '@/components/step-item'
import { chainlabTestnet } from '@/lib/network'
import { useWallet } from 'web3-connect-react'

export default function ConnectToTargetNetwork({ session }: { session?: any }) {
  const { isSignedIn, chainId, switchNetwork } = useWallet()
  const isAuth = session === undefined ? false : session.isAuth
  if (!isAuth) {
    return <></>
  }

  return (
    <StepItemComponent step={1} isDone={chainId === chainlabTestnet.chainId}>
      {chainId && (
        <div className="flex w-full flex-row flex-wrap items-center justify-between">
          {chainId === chainlabTestnet.chainId ? (
            <div>
              <span className="font-medium">
                You are connected to the {chainlabTestnet.networkName} network.
              </span>
            </div>
          ) : (
            <>
              <span>
                You are on the different network. Please switch to the{' '}
                {chainlabTestnet.networkName} network.
              </span>
              <Button
                onClick={() => {
                  switchNetwork(chainlabTestnet)
                }}
              >
                Switch network
              </Button>
            </>
          )}
        </div>
      )}
      {!chainId && <div>Loading...</div>}
    </StepItemComponent>
  )
}
