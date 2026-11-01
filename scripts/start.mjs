/**
 * App Platform / production start entry.
 * Serves Vite dist + SES verification API on $PORT.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const server = path.join(__dirname, 'server.mjs')
const child = spawn(process.execPath, [server], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))
