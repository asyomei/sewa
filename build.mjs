import { build } from 'esbuild'

await build({
  entryPoints: ['./src/main.ts'],
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  format: 'esm',
  platform: 'node',
  sourcemap: 'linked',
  bundle: true,
  minify: true,
  banner: {
    js: [
      'import { createRequire } from "node:module";',
      'var require = createRequire(import.meta.dirname);',
    ].join('\n'),
  },
})
