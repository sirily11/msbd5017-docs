'use client'

import { Button } from '@/components/shared/Button'
import ConnectWalletButton from '@/components/shared/ConnectWalletButton'
import { StepItemComponent } from '@/components/step-item'
import { useAddresses, useWallet } from 'web3-connect-react'

export default function ConnectWalletExample({ session }: { session?: any }) {
  const { signOut } = useWallet()
  const isAuth = session === undefined ? false : session.isAuth
  const { addresses } = useAddresses('ethereum')

  return (
    <StepItemComponent step={0} isDone={isAuth}>
      {isAuth ? (
        <div className="flex h-full w-full flex-row flex-wrap items-center justify-between">
          <span>
            <span>You are connected to your wallet.</span>
            <br /> <span className="font-bold">Wallet: {addresses?.[0]}</span>
          </span>
          <div>
            <Button onClick={signOut}>Sign out</Button>
          </div>
        </div>
      ) : (
        <ConnectWalletButton session={session} />
      )}
    </StepItemComponent>
  )
}
