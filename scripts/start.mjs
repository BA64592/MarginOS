import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const serveBin = require.resolve('serve/build/main.js')
const port = process.env.PORT || '8080'
const child = spawn(
  process.execPath,
  [
    serveBin,
    '-s',
    'dist',
    '-l',
    `tcp://0.0.0.0:${port}`,
    '--no-port-switching',
  ],
  { stdio: 'inherit' },
)
child.on('exit', (code) => process.exit(code ?? 1))
