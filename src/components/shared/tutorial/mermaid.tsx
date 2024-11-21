import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

export const MermaidDiagram = ({ definition }: { definition: string }) => {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    })

    // Render the diagram
    const renderDiagram = async () => {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '' // Clear previous diagram
        const { svg } = await mermaid.render('mermaid-diagram', definition)
        mermaidRef.current.innerHTML = svg
      }
    }

    renderDiagram()
  }, [definition])

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div ref={mermaidRef} className="w-full overflow-x-auto" />
    </div>
  )
}
