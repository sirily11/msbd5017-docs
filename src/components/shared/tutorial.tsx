'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

type TutorialContextType = {
  activeOutputId: string | null
  setActiveOutputId: (id: string | null) => void
  children: React.ReactNode
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export const useTutorial = () => {
  const context = useContext(TutorialContext)
  if (!context) throw new Error('Must use within TutorialProvider')
  return context
}

export const Output = ({
  children,
  id,
}: {
  children: React.ReactNode
  id: string
}) => {
  const { activeOutputId } = useTutorial()
  const isVisible = id === activeOutputId

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`sticky top-20 rounded-lg border bg-secondary p-4 text-secondary-foreground`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const Step = ({
  children,
  sticky = false,
  outputId,
}: {
  children: React.ReactNode
  sticky?: boolean
  outputId?: string
}) => {
  const isClickable = !!outputId
  const { setActiveOutputId, activeOutputId } = useTutorial()

  return (
    <Card
      className={cn(
        'mb-4 transition-all duration-300 ease-in-out',
        sticky && 'sticky top-0 z-10',
        isClickable && 'cursor-pointer',
        outputId === activeOutputId &&
          'bg-sky-50 transition-colors dark:bg-sky-800',
      )}
      data-output-id={outputId}
      onClick={() => {
        if (!isClickable) return
        setActiveOutputId(outputId)
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-grow">{children}</div>
          {isClickable && (
            <motion.div
              className="flex-shrink-0"
              initial={{ x: -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const Outputs = ({ children }: { children: React.ReactNode }) => {
  return <div className="col-span-1">{children}</div>
}

export const Steps = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setActiveOutputId, children: steps } = useTutorial()
  const [previousId, setPreviousId] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const outputId = entry.target.getAttribute('data-output-id')
          if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
            if (outputId) {
              setPreviousId(outputId)
              setActiveOutputId(outputId)
            }
          } else if (!entry.isIntersecting && entry.intersectionRatio < 0.6) {
            if (outputId === previousId && !isAtBottom) {
              const steps = Array.from(
                containerRef.current?.querySelectorAll('[data-output-id]') ||
                  [],
              )
              const currentIndex = steps.findIndex(
                (step) => step.getAttribute('data-output-id') === outputId,
              )

              // Check if we're at the last step
              if (currentIndex === steps.length - 1) {
                setIsAtBottom(true)
                return
              }

              if (currentIndex > 0) {
                const prevStep = steps[currentIndex - 1]
                const prevId = prevStep.getAttribute('data-output-id')
                if (prevId) {
                  setPreviousId(prevId)
                  setActiveOutputId(prevId)
                }
              }
            }
          }
        })
      },
      {
        threshold: [0.6, 0.9],
        root: null,
        rootMargin: '100px 20px -50% 40px',
      },
    )

    const steps = containerRef.current.querySelectorAll('[data-output-id]')
    steps.forEach((step) => observer.observe(step))

    return () => observer.disconnect()
  }, [steps, setActiveOutputId, previousId, isAtBottom])

  // Reset isAtBottom state when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const { scrollTop } = document.documentElement
      if (
        scrollTop <
        document.documentElement.scrollHeight - window.innerHeight
      ) {
        setIsAtBottom(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className={'col-span-1'}>
      <div className="space-y-20 pb-4">{children}</div>
    </div>
  )
}

export const Tutorial = ({ children }: { children: React.ReactNode }) => {
  const [activeOutputId, setActiveOutputId] = useState<string | null>(null)

  return (
    <TutorialContext.Provider
      value={{ activeOutputId, setActiveOutputId, children }}
    >
      <div className="mb-20 grid grid-cols-2 gap-10">{children}</div>
    </TutorialContext.Provider>
  )
}

export default Tutorial
