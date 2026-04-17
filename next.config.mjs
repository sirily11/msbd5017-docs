import nextMDX from '@next/mdx'

import { recmaPlugins } from './src/mdx/recma.mjs'
import { rehypePlugins } from './src/mdx/rehype.mjs'
import { remarkPlugins } from './src/mdx/remark.mjs'

const withMDX = nextMDX({
  options: {
    remarkPlugins,
    rehypePlugins,
    recmaPlugins,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  compiler: {
    removeConsole: {
      exclude: ['error', 'info'],
    },
  },
  serverExternalPackages: ['@openzeppelin/contracts'],
  outputFileTracingIncludes: {
    '/**/*': [
      './src/app/**/*.mdx',
      './node_modules/@openzeppelin/contracts/**/*.sol',
    ],
  },
}

export default withMDX(nextConfig)
