'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import {
  CopyIcon,
  CheckIcon,
  LogOutIcon,
  WalletIcon,
  UserIcon,
} from 'lucide-react'
import WalletAvatarImage from '@/components/shared/wallet/walletAvatar'

interface UserProfileProps {
  userName?: string
  userEmail?: string
  userWalletAddress: string
  userWalletBalance: string
  onSignOut: () => void
}

export default function UserProfile({
  userName = '',
  userEmail = '',
  userWalletAddress,
  userWalletBalance,
  onSignOut,
}: UserProfileProps) {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userWalletAddress)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="mx-auto w-full">
      <div className="grid gap-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-3"
        >
          {userWalletAddress && (
            <WalletAvatarImage walletAddress={userWalletAddress} size={80} />
          )}
          <div className="text-center">
            <h3 className="text-lg font-semibold tracking-tight">
              {userName || 'Connected'}
            </h3>
            {userEmail && (
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="space-y-3"
        >
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
            <Label htmlFor="wallet" className="text-xs font-medium text-gray-500 dark:text-white/50">
              Wallet Address
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <div
                id="wallet"
                className="flex-1 truncate font-mono text-sm text-gray-900 dark:text-white"
              >
                {userWalletAddress}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-white/10"
                onClick={copyToClipboard}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isCopied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="sr-only">Copy wallet address</span>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
            <Label className="text-xs font-medium text-gray-500 dark:text-white/50">
              Balance
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-gray-400 dark:text-white/40" />
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                {userWalletBalance}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.4,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="mt-6"
      >
        <Button
          variant="destructive"
          onClick={onSignOut}
          className="w-full rounded-xl py-3 text-sm font-medium"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  )
}
