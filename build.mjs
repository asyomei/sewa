// @ts-check

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { transpileDeclaration } from 'typescript'

await rm('dist', { recursive: true, force: true })
await mkdir('dist')

const cjsBuild = build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  sourcemap: 'linked',
  packages: 'external',
  outExtension: { '.js': '.cjs' },
})

const esmBuild = build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  platform: 'node',
  sourcemap: 'linked',
  packages: 'external',
  outExtension: { '.js': '.mjs' },
})

const dtsBuild = async () => {
  const source = await readFile('src/index.ts', 'utf8')
  const dts = transpileDeclaration(source, {})
  await writeFile('dist/index.d.ts', dts.outputText)
}

await Promise.all([cjsBuild, esmBuild, dtsBuild()])
