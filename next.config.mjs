import nextMDX from '@next/mdx'

import { recmaPlugins } from './src/mdx/recma.mjs'
import { rehypePlugins } from './src/mdx/rehype.mjs'
import { remarkPlugins } from './src/mdx/remark.mjs'
import withSearch from './src/mdx/search.mjs'
import MDXMenuPlugin from './src/mdx/mdx-menu-plugin.mjs'

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
      exclude: ['error', "info"],
    },
  },
  experimental: {
    outputFileTracingIncludes: {
      '/**/*': [
        './src/app/**/*.mdx',
        './node_modules/@openzeppelin/contracts/**/*.sol',
      ],
    },
  },
  webpack: (config, options) => {
    config.plugins.push(new MDXMenuPlugin())

    // Leave @openzeppelin packages as external
    config.externals = [
      function (context, request, callback) {
        if (/^@openzeppelin\//.test(request)) {
          // Externalize @openzeppelin packages
          return callback(null, 'commonjs ' + request)
        }
        callback()
      },
      ...config.externals,
    ]

    return config
  },
}

export default withSearch(withMDX(nextConfig))
