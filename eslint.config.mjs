import neostandard from 'neostandard'
import dfLibRecommended from '@data-fair/lib-utils/eslint/recommended.js'

export default [
  { ignores: ['ui/*', '**/.type/', 'node_modules/*', 'test-apps/*', 'src/*.js', '**/*.d.ts'] },
  ...dfLibRecommended,
  ...neostandard({ ts: true })
]
