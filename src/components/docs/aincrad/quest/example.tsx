'use client'

import { checker, source, solution } from '../../source-code/aincrad/quest.solc'
import dynamic from 'next/dynamic'
import { ExpandablePanels } from '@/components/shared/playground/expandable-panels'

const SolidityContextProvider = dynamic(
  () =>
    import('@/context/solidityContext').then(
      (mod) => mod.SolidityContextProvider,
    ),
  { ssr: false },
)

const Editor = dynamic(() => import('@/components/solc/Editor'), { ssr: false })

const Game = dynamic(() => import('./pixel-quest-system'), { ssr: false })

export default function QuestExample() {
  return (
    <SolidityContextProvider>
      <ExpandablePanels>
        <Editor sourceCode={source} height="900px" checker={checker} />
        <Game />
      </ExpandablePanels>
    </SolidityContextProvider>
  )
}
