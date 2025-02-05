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

  const { sdk, signIn } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  const onSignIn = useCallback(
    async (provider: AvailableProvider) => {
      setIsLoading(true)
      await signIn(provider, {
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
    <div
      key={provider.metadata.name}
      className={'h-[80px] w-full'}
      style={{
        listStyle: 'none',
      }}
    >
      <button
        // disabled={!provider.isEnabled(sdk.walletProviders)}
        onClick={handleClick}
        className={
          'bg-opacity-30 hover:bg-opacity-50 flex h-full w-full flex-row items-center rounded-[10px] bg-[#D1D5DB] p-[15px] pr-[35px] pb-[15px] pl-5 disabled:cursor-not-allowed'
        }
      >
        <div className={'flex w-full flex-row justify-between'}>
          <div className={'flex flex-row items-center space-x-2'}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${provider.metadata.name === 'MetaMask' ? 'bg-[#EAE0D7]' : 'bg-black'}`}
            >
              {image}
            </div>
            <label className={'text-sm font-bold'}>
              {provider.metadata.name} Wallet
            </label>
          </div>
          {isLoading && <div className={'absolute right-5'}></div>}
          {!provider.isEnabled(sdk.walletProviders) ? (
            <div
              className={'text-sm text-[#A0A8C0]'}
              style={{
                border: '1px solid #A0A8C0',
                padding: '3px 8px',
                borderRadius: 8,
              }}
            >
              not installed
            </div>
          ) : null}
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
    <div className={'flex p-8'}>
      <div
        className={
          'mx-auto flex w-full flex-col items-center justify-center space-y-5'
        }
      >
        <button
          className={'absolute top-10 right-10'}
          onClick={() => {
            closeModal()
          }}
        >
          <X />
        </button>
        {!isSignedIn && (
          <>
            <h1 className={'text-primary text-center text-2xl font-bold'}>
              Sign In To MSBD 5017 Website
            </h1>
            <p className={'text-center text-sm font-normal'}>
              Click on the wallet provider you would like to use to sign in to
              the MSBD 5017 website
            </p>
            <div className={'mt-5 w-full space-y-5'}>
              {sdk?.walletProviders
                .filter((p) => p.isVisible(false))
                .map((p) => {
                  return <WalletItem provider={p} closeModal={closeModal} />
                })}
            </div>
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
