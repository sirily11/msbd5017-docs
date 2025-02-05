import React from 'react'

interface TerminalProps {
  lines: string[]
}

export function Terminal({
  lines = [
    'Welcome to the mock terminal!',
    "Type 'help' for a list of commands.",
  ],
}: TerminalProps) {
  return (
    <div className="w-full min-w-[300px] max-w-2xl overflow-hidden rounded-lg bg-gray-800 shadow-lg">
      <div className="flex items-center bg-gray-700 px-4 py-2">
        <div className="flex space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="grow text-center text-sm font-medium text-gray-300">
          Terminal
        </div>
      </div>
      <div className="h-80 overflow-auto bg-black p-4 font-mono text-sm text-green-500">
        {lines.map((line, index) => (
          <div key={index} className="mb-1">
            {index === lines.length - 1 ? (
              <>
                <span>$ {line}</span>
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-green-500" />
              </>
            ) : (
              <span>$ {line}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
