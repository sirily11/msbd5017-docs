'use client'
import { compile } from '@/actions/actions'
import { useSolidity } from '@/context/solidityContext'
import { Checker } from '@/lib/interfaces'
import { Transition } from '@headlessui/react'
import { CircleAlertIcon, CircleCheck, Loader2 } from 'lucide-react'
import { editor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../shared/Button'
import dynamic from 'next/dynamic'
import {
  addSolidityABIIntellisense,
  addSolidityIntellisense,
} from './editor.utils'
import { Monaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
})

interface EditorProps {
  sourceCode?: string
  checker?: Checker
  height?: string
}

const compilationDelay = 1000
const debounce = 1000

const offsetToLineColumn = (offset: number, code: string) => {
  const lines = code.split('\n')
  let lineNumber = 1
  let columnNumber = 1
  let currentOffset = 0

  for (const line of lines) {
    if (currentOffset + line.length + 1 > offset) {
      columnNumber = offset - currentOffset + 1
      break
    }
    currentOffset += line.length + 1
    lineNumber++
  }

  return { lineNumber, columnNumber }
}

export default function Editor({
  sourceCode,
  checker,
  height = '50vh',
}: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [hasErrors, setHasErrors] = useState(false)
  const [success, setSuccess] = useState(false)
  const { setCompilerOutput, isCompiling, setIsCompiling } = useSolidity()
  const [code, setCode] = useState(sourceCode)
  const { theme } = useTheme()

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const compileSourceCode = useCallback(async (sourceCode: string) => {
    if (isCompiling) {
      return
    }
    setIsCompiling(true)
    setHasErrors(false)
    setSuccess(false)
    const result = await compile(sourceCode)
      .then((result) => {
        if ('error' in result) {
          if (!result.error) {
            throw new Error('Unknown error')
          }
          console.error(result.error)
          throw new Error(result.error)
        }
        return result
      })
      .catch((error) => {
        setIsCompiling(false)
        const sourceCode = editorRef.current!.getValue()
        const start = { lineNumber: 1, columnNumber: 1 }
        const end = offsetToLineColumn(sourceCode.length, sourceCode)
        const model = editorRef.current!.getModel()
        monacoRef.current!.editor.setModelMarkers(model!, 'compiler', [
          {
            startLineNumber: start.lineNumber,
            startColumn: start.columnNumber,
            endLineNumber: end.lineNumber,
            endColumn: end.columnNumber,
            message: 'Compiler error: ' + error.message,
            severity: monacoRef.current!.MarkerSeverity.Error,
          },
        ])
        throw error
      })
      .finally(() => {
        setTimeout(() => {
          setIsCompiling(false)
        }, compilationDelay)
      })

    // does compiler return any errors
    const hasError =
      result.errors?.some((error) => error.severity === 'error') === true
    const hasWarning =
      result.errors?.some((error) => error.severity === 'warning') === true

    result.errors?.forEach((error) => {
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel()
        if (model && error.sourceLocation) {
          const sourceCode = editorRef.current.getValue()
          const start = offsetToLineColumn(
            error.sourceLocation.start,
            sourceCode,
          )
          const end = offsetToLineColumn(error.sourceLocation.end, sourceCode)

          const servertyMap: {
            [key: string]: number
          } = {
            error: monacoRef.current.MarkerSeverity.Error,
            warning: monacoRef.current.MarkerSeverity.Warning,
          }

          const severity =
            servertyMap[error.severity] ||
            monacoRef.current.MarkerSeverity.Error

          monacoRef.current.editor.setModelMarkers(model, 'compiler', [
            {
              startLineNumber: start.lineNumber,
              startColumn: start.columnNumber,
              endLineNumber: end.lineNumber,
              endColumn: end.columnNumber,
              message: error.formattedMessage,
              severity: severity,
            },
          ])
        }
      }
    })

    // add intellisense using the abi
    if (result.abis) {
      // merge all abis into one single abi array
      addSolidityABIIntellisense(monacoRef.current!, result.abis!)
    }

    // if compiler does not return any errors, run the checker
    if (checker && !hasError) {
      const [hasErrors, message] = await checker(result)
      setHasErrors(hasErrors)
      if (hasErrors) {
        // set marker
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel()
          if (model) {
            // set the error at the first line to the end of the file
            const sourceCode = editorRef.current.getValue()
            const start = { lineNumber: 1, columnNumber: 1 }
            const end = offsetToLineColumn(sourceCode.length, sourceCode)
            monacoRef.current.editor.setModelMarkers(model, 'compiler', [
              {
                startLineNumber: start.lineNumber,
                startColumn: start.columnNumber,
                endLineNumber: end.lineNumber,
                endColumn: end.columnNumber,
                message,
                severity: monacoRef.current.MarkerSeverity.Error,
              },
            ])
          }
        }
        return
      }
    }
    setSuccess(!hasError)
    setHasErrors(hasError)
    if (!hasError) setCompilerOutput(result)
    if (hasError || hasWarning) return
    // Clear markers if no errors
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'compiler', [])
      }
    }
  }, [])

  const debouncedCompile = useCallback(
    (sourceCode: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        compileSourceCode(sourceCode)
      }, debounce) // 1 second delay
    },
    [compileSourceCode],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [compileSourceCode])

  useEffect(() => {
    if (sourceCode) {
      setCode(sourceCode)
    }
  }, [sourceCode])

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        const isFocused = editorRef.current?.hasTextFocus()
        if (!isFocused) return
        e.preventDefault()
        const sourceCode = editorRef.current?.getValue()
        if (sourceCode) {
          compileSourceCode(sourceCode)
        }
      }
    }
    document.addEventListener('keydown', listener)
    return () => {
      document.removeEventListener('keydown', listener)
    }
  }, [])

  const vscodeTheme = useMemo(() => {
    let media = window.matchMedia('(prefers-color-scheme: dark)')
    if (theme === 'system') {
      return media.matches ? 'vs-dark' : 'light'
    }

    return theme === 'dark' ? 'vs-dark' : 'light'
  }, [theme])

  return (
    <div className="relative h-auto space-y-2 rounded-xl border p-5">
      <MonacoEditor
        language="sol"
        value={code}
        height={height}
        theme={vscodeTheme}
        className="rounded-xl"
        onChange={(value) => {
          setCode(value)
          if (value) {
            debouncedCompile(value)
          }
        }}
        onMount={(editor, monaco) => {
          if (!editorRef.current) {
            editorRef.current = editor
            monacoRef.current = monaco
            addSolidityIntellisense(monaco)
          }
        }}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
      <Button
        disabled={isCompiling}
        onClick={async () => {
          if (editorRef.current) {
            const sourceCode = editorRef.current.getValue()
            await compileSourceCode(sourceCode)
          }
        }}
        className={`${hasErrors ? 'bg-red-500! hover:bg-red-400' : ''} ${success ? 'bg-green-500!' : ''} dark:text-white`}
      >
        <div
          className={`relative h-8 ${isCompiling ? 'w-8' : hasErrors ? 'w-52' : 'w-44'} ${success ? 'w-42!' : ''} overflow-hidden transition-all`}
        >
          <Transition
            show={isCompiling}
            enter="transition-all duration-300 ease-in-out"
            enterFrom="opacity-0 translate-x-full scale-50"
            enterTo="opacity-100 translate-x-0 scale-100"
            leave="transition-all duration-300 ease-in-out"
            leaveFrom="opacity-100 translate-x-0 scale-100"
            leaveTo="opacity-0 translate-x-full scale-50"
          >
            <div className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 transform">
              <Loader2 className="animate-spin" />
            </div>
          </Transition>
          <Transition
            show={!isCompiling}
            enter="transition-all duration-300 ease-in-out"
            enterFrom="opacity-0 -translate-x-full"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-300 ease-in-out"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 -translate-x-full"
          >
            <span className="absolute left-0 top-1/2 flex -translate-y-1/2 transform flex-row items-start justify-start whitespace-nowrap">
              {hasErrors && (
                <>
                  <CircleAlertIcon />
                  <span className="ml-2">Source contains errors</span>
                </>
              )}{' '}
              {success && (
                <>
                  <CircleCheck className="mr-1 shrink-0" />
                  <span>Compiled successfully</span>
                </>
              )}
              {!hasErrors && !success && 'Compile (Cmd/Ctrl + S)'}
            </span>
          </Transition>
        </div>
      </Button>
    </div>
  )
}
