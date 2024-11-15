'use client'
import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FileStructure =
  | {
      [key: string]:
        | FileStructure
        | null
        | { content: FileStructure | null; highlighted: boolean }
    }
  | null
  | undefined

interface FileExplorerProps {
  structure: FileStructure
}

export function FileExplorer({ structure }: FileExplorerProps) {
  return (
    <div className="rounded-lg text-card-foreground">
      {structure ? (
        <FileTree structure={structure} />
      ) : (
        <p className="text-muted-foreground">No file structure provided.</p>
      )}
    </div>
  )
}

interface FileTreeProps {
  structure: FileStructure
  level?: number
}

function hasHighlightedContent(structure: FileStructure): boolean {
  if (!structure || typeof structure !== 'object') {
    return false
  }

  return Object.entries(structure).some(([_, content]) => {
    if (content === null) return false

    if (typeof content === 'object') {
      if ('highlighted' in content) {
        if (content.highlighted) return true
        //@ts-ignore
        return hasHighlightedContent(content.content)
      }
      return hasHighlightedContent(content)
    }

    return false
  })
}

function FileTree({ structure, level = 0 }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize expanded folders based on highlighted content
    const initialExpanded = new Set<string>()
    Object.entries(structure || {}).forEach(([name, content]) => {
      if (content !== null && typeof content === 'object') {
        const isHighlightedObject = 'highlighted' in content
        const itemContent = isHighlightedObject ? content.content : content

        if (
          //@ts-expect-error
          hasHighlightedContent(itemContent) ||
          (isHighlightedObject && content.highlighted)
        ) {
          initialExpanded.add(name)
        }
      }
    })
    setExpandedFolders(initialExpanded)
  }, [structure])

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderName)) {
        newSet.delete(folderName)
      } else {
        newSet.add(folderName)
      }
      return newSet
    })
  }

  if (!structure || typeof structure !== 'object') {
    return null
  }

  return (
    <ul className="list-none pl-4">
      {Object.entries(structure).map(([name, content]) => {
        const isHighlightedObject =
          content !== null &&
          typeof content === 'object' &&
          'highlighted' in content
        const isFolder =
          content !== null &&
          ((typeof content === 'object' && !('highlighted' in content)) ||
            (isHighlightedObject && content.content !== null))
        const isExpanded = expandedFolders.has(name)
        const isHighlighted = isHighlightedObject && content.highlighted
        const itemContent = isHighlightedObject ? content.content : content

        return (
          <li key={name} className="my-1">
            <Button
              variant="ghost"
              className={`w-full justify-start text-left ${
                isHighlighted
                  ? 'bg-sky-100 text-secondary-foreground hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-700'
                  : ''
              }`}
              onClick={() => {
                if (isFolder) toggleFolder(name)
              }}
              aria-expanded={isFolder ? isExpanded : undefined}
            >
              {isFolder ? (
                isExpanded ? (
                  <ChevronDown className="mr-1 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-1 h-4 w-4" />
                )
              ) : (
                <span className="mr-1 h-4 w-4" />
              )}
              {isFolder ? (
                <Folder className="mr-2 h-4 w-4" />
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              <span>{name}</span>
            </Button>
            {isFolder && isExpanded && (
              <FileTree structure={itemContent as any} level={level + 1} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
