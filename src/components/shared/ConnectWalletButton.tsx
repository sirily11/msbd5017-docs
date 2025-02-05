'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { NativeModal } from './modal/NativeModal'
import { ConnectWalletModal } from './wallet/wallet-modal'
import { useWallet } from 'web3-connect-react'
import { Wallet } from 'lucide-react'

export default function ConnectWalletButton({ session }: { session: any }) {
  const [openModal, setOpenModal] = useState(false)
  const { isLoading } = useWallet()

  const isAuth = session === undefined ? false : session.isAuth

  return (
    <div>
      {isAuth ? (
        <Button
          disabled={isLoading}
          onClick={() => {
            setOpenModal(true)
          }}
        >
          <Wallet />
        </Button>
      ) : (
        <Button
          disabled={isLoading}
          onClick={() => {
            setOpenModal(true)
          }}
          className="connect-wallet-button cursor-pointer"
        >
          Connect Wallet
        </Button>
      )}
      <NativeModal
        openModal={openModal}
        closeModal={() => setOpenModal(false)}
        className="w-full max-w-[800px]"
      >
        <ConnectWalletModal
          isSignedIn={isAuth}
          closeModal={() => {
            setOpenModal(false)
          }}
        />
      </NativeModal>
    </div>
  )
}
