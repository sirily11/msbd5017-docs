'use client'

import { checker, source, solution } from '../../source-code/aincrad/quest.solc'
import dynamic from 'next/dynamic'

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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="col-span-1">
          <Editor sourceCode={source} height="900px" checker={checker} />
        </div>
        <div className="col-span-1">
          <Game />
        </div>
      </div>
    </SolidityContextProvider>
  )
}
