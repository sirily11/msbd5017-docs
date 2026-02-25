'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { trackPageView, trackStayTime } from '@/lib/analytics'

export function AnalyticsPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const startTimeRef = useRef<number>(Date.now())
  const previousPathRef = useRef<string>(pathname)

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '')
    trackPageView(url)

    if (previousPathRef.current !== pathname) {
      const stayDuration = Date.now() - startTimeRef.current
      trackStayTime(previousPathRef.current, stayDuration)
      startTimeRef.current = Date.now()
      previousPathRef.current = pathname
    }

    const handleBeforeUnload = () => {
      const stayDuration = Date.now() - startTimeRef.current
      trackStayTime(pathname, stayDuration)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname, searchParams])

  return null
}
