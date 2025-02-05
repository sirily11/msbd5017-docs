'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

import { Footer } from '@/components/shared/Footer'
import { Header } from '@/components/shared/Header'
import { Logo } from '@/components/shared/Logo'
import { Navigation } from '@/components/shared/Navigation'
import {
  type Section,
  SectionProvider,
} from '@/components/shared/SectionProvider'
import { config } from '../config'

export function Layout({
  children,
  allSections,
  session,
}: {
  children: React.ReactNode
  allSections: Record<string, Array<Section>>
  session?: any
}) {
  let pathname = usePathname()

  return (
    <SectionProvider sections={allSections[pathname] ?? []}>
      <div className="h-full lg:ml-72 xl:ml-80">
        <motion.header
          layoutScroll
          className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex"
        >
          <div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pt-4 lg:pb-8 xl:w-80 lg:dark:border-white/10">
            <div className="hidden lg:flex">
              <Link
                href="/"
                aria-label="Home"
                className="flex flex-row items-center justify-center gap-4"
              >
                <Logo className="h-6 scale-[300%]" />
                <span className="font-bold">{config.productName}</span>
              </Link>
            </div>

            <Header
              // @ts-expect-error
              session={session}
            />
            <Navigation className="hidden lg:mt-10 lg:block" />
          </div>
        </motion.header>
        <div className="relative flex h-full flex-col px-4 pt-14 sm:px-6 lg:px-8">
          <main className="flex-auto">{children}</main>
          <Footer />
        </div>
      </div>
    </SectionProvider>
  )
}
