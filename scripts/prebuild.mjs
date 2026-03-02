import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import matter from 'gray-matter'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import glob from 'fast-glob'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import { filter } from 'unist-util-filter'
import { SKIP, visit } from 'unist-util-visit'

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

// ── Navigation Generation (from MDXMenuPlugin) ──

function buildMenu(dir, baseHref = '') {
  const files = fs.readdirSync(dir)
  let currentItem = null
  const subItems = []

  const pageFile = files.find((file) => file === 'page.mdx')
  if (pageFile) {
    const filePath = path.join(dir, pageFile)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    const title = data.title || path.basename(dir)
    const href = '/' + baseHref.replace(/\\/g, '/')
    currentItem = { title, href }
  }

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      const subItem = buildMenu(filePath, path.join(baseHref, file))
      if (subItem) {
        subItems.push(subItem)
      }
    }
  }

  if (currentItem) {
    if (subItems.length > 0) {
      return { ...currentItem, links: subItems }
    } else {
      return currentItem
    }
  } else if (subItems.length > 0) {
    return { title: path.basename(dir), links: subItems }
  }

  return null
}

function generateNavigation() {
  const appDir = path.join(rootDir, 'src', 'app')
  const menu = buildMenu(appDir)
  const filteredMenu = menu && menu.title === 'app' ? menu.links : menu

  const tsContent = `
// This file is auto-generated. Do not edit manually.

export interface NavLink {
  title: string;
  href: string;
}

export interface NavGroup {
  title: string;
  href?: string
  links?: (NavLink | NavGroup)[]
}

export const navigation: NavGroup[] = ${JSON.stringify(filteredMenu, null, 2)};
`

  const outputPath = path.join(rootDir, 'src', 'navigation', 'navigation.ts')
  const contentHash = crypto.createHash('md5').update(tsContent).digest('hex')

  let existingHash = ''
  if (fs.existsSync(outputPath)) {
    existingHash = crypto
      .createHash('md5')
      .update(fs.readFileSync(outputPath, 'utf-8'))
      .digest('hex')
  }

  if (contentHash !== existingHash) {
    console.log('Writing navigation.ts')
    fs.writeFileSync(outputPath, tsContent)
    console.log('Wrote navigation.ts')
  } else {
    console.log('navigation.ts is up to date')
  }
}

// ── Search Data Generation (from search.mjs) ──

function isObjectExpression(node) {
  return (
    node.type === 'mdxTextExpression' &&
    node.data?.estree?.body?.[0]?.expression?.type === 'ObjectExpression'
  )
}

function excludeObjectExpressions(tree) {
  return filter(tree, (node) => !isObjectExpression(node))
}

function extractSections() {
  return (tree, { sections }) => {
    const slugify = slugifyWithCounter()
    slugify.reset()

    visit(tree, (node) => {
      if (node.type === 'heading' || node.type === 'paragraph') {
        let content = toString(excludeObjectExpressions(node))
        if (node.type === 'heading' && node.depth <= 2) {
          let hash = node.depth === 1 ? null : slugify(content)
          sections.push([content, hash, []])
        } else {
          sections.at(-1)?.[2].push(content)
        }
        return SKIP
      }
    })
  }
}

function generateSearchData() {
  const appDir = path.join(rootDir, 'src', 'app')
  const processor = remark().use(remarkMdx).use(extractSections)

  let files = glob.sync('**/*.mdx', { cwd: appDir })
  let data = files.map((file) => {
    let url = '/' + file.replace(/(^|\/)page\.mdx$/, '')
    let mdx = fs.readFileSync(path.join(appDir, file), 'utf8')
    let sections = []
    let vfile = { value: mdx, sections }
    processor.runSync(processor.parse(vfile), vfile)
    return { url, sections }
  })

  const outputPath = path.join(rootDir, 'src', 'mdx', 'search-data.json')
  const jsonContent = JSON.stringify(data)

  const contentHash = crypto.createHash('md5').update(jsonContent).digest('hex')
  let existingHash = ''
  if (fs.existsSync(outputPath)) {
    existingHash = crypto
      .createHash('md5')
      .update(fs.readFileSync(outputPath, 'utf-8'))
      .digest('hex')
  }

  if (contentHash !== existingHash) {
    console.log('Writing search-data.json')
    fs.writeFileSync(outputPath, jsonContent)
    console.log('Wrote search-data.json')
  } else {
    console.log('search-data.json is up to date')
  }
}

// ── Run ──

generateNavigation()
generateSearchData()
