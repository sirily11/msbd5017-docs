type GTagEvent = {
  action: string
  category: string
  label?: string
  value?: number
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function trackEvent({ action, category, label, value }: GTagEvent) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

export function trackPageView(url: string) {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID)
    return
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

export function trackCodeExecution(
  contractName: string,
  durationMs: number,
  success: boolean,
) {
  trackEvent({
    action: 'code_execution',
    category: 'contract',
    label: contractName,
    value: Math.round(durationMs),
  })
  trackEvent({
    action: success ? 'execution_success' : 'execution_failure',
    category: 'contract',
    label: contractName,
  })
}

export function trackStayTime(pagePath: string, durationMs: number) {
  trackEvent({
    action: 'stay_time',
    category: 'engagement',
    label: pagePath,
    value: Math.round(durationMs / 1000),
  })
}
