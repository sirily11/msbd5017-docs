import { Monaco } from '@monaco-editor/react'
import { editor, IDisposable, IPosition, languages } from 'monaco-editor'

let hasBeenInitialized = false
export function addSolidityIntellisense(monaco: Monaco) {
  if (hasBeenInitialized) return
  monaco.languages.register({ id: 'sol' })
  // delete previous language configuration

  // Define Solidity keywords
  const solidityKeywords = [
    'function',
    'pure',
    'view',
    'public',
    'private',
    'internal',
    'external',
    'payable',
    'contract',
    'address',
    'uint',
    'int',
    'bool',
    'string',
    'bytes',
    'mapping',
    'struct',
    'enum',
    'if',
    'else',
    'for',
    'while',
    'do',
    'break',
    'continue',
    'return',
    'returns',
    'pragma',
    'import',
    'using',
    'library',
    'interface',
    'modifier',
    'event',
    'emit',
    'constructor',
    'fallback',
    'receive',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'uint128',
    'uint256',
    'int8',
    'int16',
    'int32',
    'int64',
  ]

  // Configure Solidity language features
  monaco.languages.setLanguageConfiguration('sol', {
    wordPattern:
      /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  })

  // Define token provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider('sol', {
    defaultToken: '',
    tokenPostfix: '.sol',
    keywords: solidityKeywords,
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
      root: [
        [
          /[a-z_$][\w$]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [/[A-Z][\w\$]*/, 'type.identifier'],

        { include: '@whitespace' },

        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],

        [/[;,.]/, 'delimiter'],

        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],

      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],
    },
  })

  // Configure auto-completion
  monaco.languages.registerCompletionItemProvider('sol', {
    provideCompletionItems: (model: editor.ITextModel, position: IPosition) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      return {
        suggestions: solidityKeywords.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
        })),
      }
    },
  })

  hasBeenInitialized = true
}

let disposables: IDisposable[] = []

/**
 * Add Solidity ABI intellisense to the Monaco editor
 * @param monaco Monaco instance
 * @param abi  ABI of the contract
 */
export function addSolidityABIIntellisense(monaco: Monaco, abi: any[]) {
  // Clear previous settings
  console.log('clearing previous settings')
  console.log(disposables.length)
  disposables.forEach((d) => d.dispose())
  disposables = []

  // Register language if not already registered
  monaco.languages.register({ id: 'sol' })

  // Define ABI-based suggestions
  const abiSuggestions = abi.map((item) => {
    let suggestion: languages.CompletionItem = {
      label: item.name,
      kind: getCompletionItemKind(item.type),
      insertText: item.name,
      detail: `${item.type} ${item.name}`,
      documentation: {
        value: createDocumentation(item),
      },
      range: {
        startLineNumber: 0,
        endLineNumber: 0,
        startColumn: 0,
        endColumn: 0,
      },
    }

    if (item.type === 'function') {
      const params =
        item.inputs
          ?.map((input: any) => `${input.type} ${input.name}`)
          .join(', ') || ''
      suggestion.insertText = `${item.name}(${params})`
      suggestion.insertTextRules =
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }

    return suggestion
  })

  // Configure auto-completion
  console.log('registering completion provider')
  const completionProvider = monaco.languages.registerCompletionItemProvider(
    'sol',
    {
      provideCompletionItems: (model: editor.ITextModel, position: IPosition) => {
        const wordInfo = model.getWordUntilPosition(position)
        const word = wordInfo.word.toLowerCase()
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endColumn: wordInfo.endColumn,
        }

        const matchingSuggestions = abiSuggestions.filter(
          (suggestion: languages.CompletionItem) => {
            if (typeof suggestion.label === 'string') {
              return suggestion.label.toLowerCase().includes(word)
            }

            if (suggestion.label === undefined) {
              return false
            }

            if ('label' in suggestion.label) {
              return suggestion.label.label.toLowerCase().includes(word)
            }
          },
        )

        return {
          suggestions: matchingSuggestions.map((suggestion) => ({
            ...suggestion,
            range: range,
          })),
        }
      },
    },
  )

  disposables.push(completionProvider)

  // Add hover provider
  console.log('registering hover provider')
  const hoverProvider = monaco.languages.registerHoverProvider('sol', {
    provideHover: (model: editor.ITextModel, position: IPosition) => {
      const word = model.getWordAtPosition(position)
      if (!word) return null
      const matchingItem = abi.find((item) => item.name === word.word)
      if (!matchingItem) return null

      const content = ` \` ${matchingItem.type} ${matchingItem.name} \`
      ${matchingItem.contractName ? `\n*Contract:* ${matchingItem.contractName}` : ''}
      ${matchingItem.fileName ? `\n*File:* ${matchingItem.fileName}` : ''}
      ${matchingItem.inputs && matchingItem.inputs.length > 0 ? `\n${formatParams(matchingItem.inputs)}` : ''}
      ${matchingItem.outputs && matchingItem.outputs.length > 0 ? `\n*@returns* ${formatParams(matchingItem.outputs)}` : ''}
      ${matchingItem.stateMutability ? `\n*@${matchingItem.stateMutability}*` : ''}
      ${matchingItem.payable !== undefined ? `\n*@payable* ${matchingItem.payable}` : ''}`.trim()
      return {
        contents: [
          {
            value: content,
          },
        ],
      }
    },
  })

  disposables.push(hoverProvider)
}

const formatParams = (params: any[] | undefined) => {
  if (!params || params.length === 0) return 'None'
  return params
    .map((param) => `*@param* \`${param.name}\` — ${param.type}`)
    .join('\n')
}

const createDocumentation = (item: any) =>
  `${item.contractName ? `\n*Contract:* ${item.contractName}` : ''}
${item.fileName ? `\n*File:* ${item.fileName}` : ''}
${item.inputs && item.inputs.length > 0 ? `\n${formatParams(item.inputs)}` : ''}
${item.outputs && item.outputs.length > 0 ? `\n*@returns* ${formatParams(item.outputs)}` : ''}
${item.stateMutability ? `\n*@${item.stateMutability}*` : ''}
${item.payable !== undefined ? `\n*@payable* ${item.payable}` : ''}`.trim()

function getCompletionItemKind(abiType: string): languages.CompletionItemKind {
  switch (abiType.toLowerCase()) {
    case 'function':
      return languages.CompletionItemKind.Function
    case 'event':
      return languages.CompletionItemKind.Event
    case 'constructor':
      return languages.CompletionItemKind.Constructor
    case 'fallback':
    case 'receive':
      return languages.CompletionItemKind.Method
    default:
      return languages.CompletionItemKind.Property
  }
}
