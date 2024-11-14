'use client'

import React from 'react'
import { Highlight, Language, themes } from 'prism-react-renderer'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'

interface CodeHighlighterProps {
  code: string
  language: Language
  fileName?: string
  highlightLines?: number[]
  className?: string
}

export function CodeHighlighterComponent({
  code,
  language,
  highlightLines = [],
  className,
  fileName,
}: CodeHighlighterProps) {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {fileName && (
          <span className="rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground">
            {fileName}
          </span>
        )}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <Highlight code={code} language={language} theme={themes.nightOwl}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(className, 'mt-2 overflow-auto rounded-lg p-4')}
            style={style}
          >
            {tokens.map((line, i) => (
              <div
                key={i}
                {...getLineProps({ line, key: i })}
                className={cn(
                  'table-row',
                  highlightLines.includes(i + 1) &&
                    'bg-yellow-500 bg-opacity-20',
                )}
              >
                <span className="table-cell select-none pr-4 text-right opacity-50">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
