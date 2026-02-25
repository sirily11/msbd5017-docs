import { type Metadata } from 'next'
import glob from 'fast-glob'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Suspense } from 'react'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/shared/Layout'
import { type Section } from '@/components/shared/SectionProvider'
import { AnalyticsPageTracker } from '@/components/analytics/AnalyticsPageTracker'
import { GA_MEASUREMENT_ID } from '@/lib/analytics'

import '@/styles/tailwind.css'
import { session } from '@/actions/actions'
import { config } from '@/components/config'

export const metadata: Metadata = {
  title: {
    template: `${config.productName} - %s`,
    default: `${config.productName} Document`,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let pages = await glob('**/*.mdx', { cwd: 'src/app' })
  let allSectionsEntries = (await Promise.all(
    pages.map(async (filename) => [
      '/' + filename.replace(/(^|\/)page\.mdx$/, ''),
      (await import(`./${filename}`)).sections,
    ]),
  )) as Array<[string, Array<Section>]>
  let allSections = Object.fromEntries(allSectionsEntries)
  const currentSession = await session()

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="flex min-h-full bg-white antialiased dark:bg-zinc-900">
        <Providers session={currentSession}>
          <div className="w-full">
            <Layout allSections={allSections} session={currentSession}>
              {children}
            </Layout>
          </div>
        </Providers>
        <Suspense fallback={null}>
          <AnalyticsPageTracker />
        </Suspense>
      </body>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  )
}
