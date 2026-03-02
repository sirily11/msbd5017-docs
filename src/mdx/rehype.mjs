import { slugifyWithCounter } from '@sindresorhus/slugify'
import * as acorn from 'acorn'
import { toString } from 'mdast-util-to-string'
import { mdxAnnotations } from 'mdx-annotations'
import {
  createHighlighter,
  createCssVariablesTheme,
  bundledLanguages,
} from 'shiki'
import { visit } from 'unist-util-visit'
import rehypeSlug from 'rehype-slug'

function rehypeParseCodeBlocks() {
  return (tree) => {
    visit(tree, 'element', (node, _nodeIndex, parentNode) => {
      if (node.tagName === 'code' && node.properties.className) {
        parentNode.properties.language = node.properties.className[0]?.replace(
          /^language-/,
          '',
        )
      }
    })
  }
}

const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
})

let highlighter

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const validCssColor = /^(?:var\(--[\w-]+\)|#[\da-fA-F]{3,8}|[\w]+)$/

function renderToken(token) {
  let style = ''
  if (token.color && validCssColor.test(token.color)) {
    style += `color:${token.color}`
  }
  if (token.fontStyle) {
    if (token.fontStyle & 1) style += ';font-style:italic'
    if (token.fontStyle & 2) style += ';font-weight:bold'
    if (token.fontStyle & 4) style += ';text-decoration:underline'
  }
  if (style) {
    return `<span style="${style}">${escapeHtml(token.content)}</span>`
  }
  return `<span>${escapeHtml(token.content)}</span>`
}

function rehypeShiki() {
  return async (tree) => {
    highlighter =
      highlighter ??
      (await createHighlighter({
        themes: [cssVariablesTheme],
        langs: Object.keys(bundledLanguages),
      }))

    visit(tree, 'element', (node) => {
      if (node.tagName === 'pre' && node.children[0]?.tagName === 'code') {
        let codeNode = node.children[0]
        let textNode = codeNode.children[0]

        node.properties.code = textNode.value

        if (node.properties.language) {
          let tokens = highlighter.codeToTokensBase(textNode.value, {
            lang: node.properties.language,
            theme: 'css-variables',
          })

          textNode.value = tokens
            .map(
              (line) =>
                `<span>${line.map(renderToken).join('')}</span>`,
            )
            .join('\n')
        }
      }
    })
  }
}

function rehypeSlugify() {
  return (tree) => {
    let slugify = slugifyWithCounter()
    visit(tree, 'element', (node) => {
      if (node.tagName === 'h2' && !node.properties.id) {
        node.properties.id = slugify(toString(node))
      }
    })
  }
}

function rehypeAddMDXExports(getExports) {
  return (tree, file) => {
    const exports = Object.entries({
      ...getExports(tree),
      frontmatter: JSON.stringify(file.data.frontmatter || {}),
    })

    for (const [name, value] of exports) {
      for (const node of tree.children) {
        if (
          node.type === 'mdxjsEsm' &&
          new RegExp(`export\\s+const\\s+${name}\\s*=`).test(node.value)
        ) {
          return
        }
      }

      let exportStr = `export const ${name} = ${value}`

      tree.children.push({
        type: 'mdxjsEsm',
        value: exportStr,
        data: {
          estree: acorn.parse(exportStr, {
            sourceType: 'module',
            ecmaVersion: 'latest',
          }),
        },
      })
    }
  }
}

function getSections(node) {
  let sections = []

  for (let child of node.children ?? []) {
    if (child.type === 'element' && child.tagName === 'h2') {
      sections.push(`{
        title: ${JSON.stringify(toString(child))},
        id: ${JSON.stringify(child.properties.id)},
        ...${child.properties.annotation}
      }`)
    } else if (child.children) {
      sections.push(...getSections(child))
    }
  }

  return sections
}

export const rehypePlugins = [
  mdxAnnotations.rehype,
  rehypeParseCodeBlocks,
  rehypeShiki,
  rehypeSlugify,
  rehypeSlug,
  [
    rehypeAddMDXExports,
    (tree) => ({
      sections: `[${getSections(tree).join()}]`,
    }),
  ],
]
