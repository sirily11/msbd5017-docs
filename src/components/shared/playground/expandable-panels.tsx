'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  children: React.ReactNode[]
}

export function ExpandablePanels({ children }: Props) {
  const [leftOpen, setLeftOpen] = React.useState(true)
  const [rightOpen, setRightOpen] = React.useState(true)

  return (
    <TooltipProvider>
      <div className="flex min-h-[600px] w-full flex-col">
        <div className="flex justify-end space-x-1 p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftOpen(!leftOpen)}
                disabled={!rightOpen}
              >
                {leftOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {leftOpen ? 'Hide' : 'Show'} Left Panel
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{leftOpen ? 'Hide' : 'Show'} Left Panel</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightOpen(!rightOpen)}
                disabled={!leftOpen}
              >
                {rightOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRight className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {rightOpen ? 'Hide' : 'Show'} Right Panel
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{rightOpen ? 'Hide' : 'Show'} Right Panel</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex grow flex-col gap-4 p-4 md:flex-row">
          <AnimatePresence initial={false}>
            {leftOpen && (
              <motion.div
                key="left-panel"
                initial={{ flexBasis: '0%', width: 0 }}
                animate={{
                  flexBasis: rightOpen ? '50%' : '100%',
                  width: 'auto',
                }}
                exit={{ flexBasis: '0%', width: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="flex-1 overflow-hidden rounded-md"
              >
                <div className="flex h-full flex-col">{children[0]}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {rightOpen && (
              <motion.div
                key="right-panel"
                initial={{ flexBasis: '0%', width: 0 }}
                animate={{
                  flexBasis: leftOpen ? '50%' : '100%',
                  width: 'auto',
                }}
                exit={{ flexBasis: '0%', width: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="flex-1 overflow-hidden rounded-md"
              >
                <div className="flex h-full flex-col">{children[1]}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  )
}
