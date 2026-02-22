import { signIn as serverSignIn, storeSession } from '@/actions/actions'
import { X } from 'lucide-react'
import { cloneElement, useCallback, useState } from 'react'
import {
  AvailableProvider,
  useAddresses,
  useBalance,
  useWallet,
  WalletProvider,
} from 'web3-connect-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import UserProfile from '@/hooks/user-profile'
import { axiomGemeni } from '@/lib/network'

interface Props {
  closeModal: () => void
  isSignedIn: boolean
}

/**
 * Return a string with length characters from the start and end of the content.
 * The middle characters are replaced with an ellipsis.
 * @param content The content to shorten
 * @param length number of characters to keep from the start and end
 */
export function omitMiddle(content: string, length: number) {
  if (content.length <= length * 2) return content
  return `${content.slice(0, length)}...${content.slice(-length)}`
}

function WalletItem({
  provider,
  closeModal,
}: {
  provider: WalletProvider
  closeModal: () => void
}) {
  const image = cloneElement(provider.metadata.image as any, {
    className: 'rounded-lg h-5! w-5! object-cover!',
  })

  const { sdk } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  const onSignIn = useCallback(
    async (provider: AvailableProvider) => {
      setIsLoading(true)
      await sdk
        .signIn({
          provider,
          network: axiomGemeni,
          callbacks: {
            onSignedIn: async (walletAddress, provider, session) => {
              const { error } = await storeSession(walletAddress, session)
              if (error) {
                throw new Error(error)
              }
              window.location.reload()
            },
            getSignInData: async (address, provider) => {
              const message = 'Sign In to MSBD 5017 website'
              const signature = await provider.signMessage(message, {
                forAuthentication: true,
              })
              const { error } = await serverSignIn(address, message, signature)
              if (error) {
                throw new Error(error)
              }
              return {}
            },
          },
        })
        .catch((e) => {
          alert(e.message)
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [sdk],
  )

  const handleClick = () => {
    if (!provider.isEnabled(sdk.walletProviders)) {
      window.open(provider.metadata.downloadLink, '_blank')
      closeModal()
    } else {
      onSignIn(provider.metadata.name)
    }
  }

  return (
    <div key={provider.metadata.name} className="w-full">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={
          'group flex w-full items-center rounded-2xl border border-gray-200/60 bg-white/80 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:cursor-pointer hover:border-gray-300 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
        }
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 ${
                provider.metadata.name === 'MetaMask'
                  ? 'bg-[#FFF7F0] dark:bg-[#FFF7F0]/10'
                  : 'bg-gray-100 dark:bg-white/10'
              } group-hover:scale-110`}
            >
              {image}
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
              {provider.metadata.name}
            </span>
          </div>
          {isLoading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800 dark:border-white/20 dark:border-t-white" role="status" aria-label="Connecting" />
          )}
          {!isLoading && !provider.isEnabled(sdk.walletProviders) && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-white/50">
              Install
            </span>
          )}
          {!isLoading && provider.isEnabled(sdk.walletProviders) && (
            <svg
              className="h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
      </button>
    </div>
  )
}

export function ConnectWalletModal({ closeModal, isSignedIn }: Props) {
  const { sdk, signOut } = useWallet()
  const { addresses } = useAddresses('ethereum')
  const { balance } = useBalance('ethereum')

  return (
    <div className="relative px-8 py-10">
      <button
        className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
        onClick={() => {
          closeModal()
        }}
      >
        <X className="h-4 w-4 text-gray-500 dark:text-white/60" />
      </button>
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {!isSignedIn && (
          <>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3"
                />
              </svg>
            </div>
            <h1 className="mb-1 text-center text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Connect Wallet
            </h1>
            <p className="mb-8 text-center text-sm leading-relaxed text-gray-500 dark:text-white/50">
              Choose a wallet to sign in to MSBD 5017
            </p>
            <div className="w-full space-y-3">
              {sdk?.walletProviders
                .filter((p) => p.isVisible(false))
                .map((p) => (
                  <WalletItem
                    key={p.metadata.name}
                    provider={p}
                    closeModal={closeModal}
                  />
                ))}
            </div>
            <p className="mt-6 text-center text-xs leading-relaxed text-gray-400 dark:text-white/30">
              By connecting, you agree to sign a message to verify your identity.
            </p>
          </>
        )}

        {isSignedIn && (
          <UserProfile
            userWalletAddress={addresses?.[0]}
            userWalletBalance={balance?.[0]}
            onSignOut={function (): void {
              signOut()
              closeModal()
            }}
          />
        )}
      </div>
    </div>
  )
}
