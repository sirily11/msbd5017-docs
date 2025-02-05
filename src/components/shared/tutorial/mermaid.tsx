'use client'

import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

export const MermaidDiagram = ({
  definition,
  id,
  diagramClassName,
  className,
}: {
  definition: string
  id: string
  className?: string
  diagramClassName?: string
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'forest',
      deterministicIds: true,
      securityLevel: 'loose',
    })

    // Render the diagram
    const renderDiagram = async () => {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '' // Clear previous diagram

        const uniqueId = `mermaid-${id}-${Date.now()}`
        const { svg } = await mermaid.render(uniqueId, definition)
        console.log('Rendered Mermaid diagram:', svg)
        mermaidRef.current.innerHTML = svg
      }
    }

    renderDiagram().catch((error) => {
      console.error('Failed to render Mermaid diagram:', error)
    })
  }, [definition, id])

  return (
    <div className={`rounded-lg bg-white p-4 shadow-xs ${className}`}>
      <div
        ref={mermaidRef}
        className={`w-full overflow-x-auto overflow-y-auto`}
      />
    </div>
  )
}
