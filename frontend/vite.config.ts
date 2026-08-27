import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const coursDir = path.join(__dirname, 'src/content/cours')
const slugs = fs.existsSync(coursDir) ? fs.readdirSync(coursDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) : []

// ponytail: dev = SPA router (CSS HMR works), build = Start prerender (SEO). fs scan is build-time prerender discovery.
const isDev = process.env.NODE_ENV !== 'production'
export default defineConfig({
  plugins: [
    ...(isDev
      ? [tanstackRouter({ target: 'react', autoCodeSplitting: true })]
      : [
          tanstackStart({
            prerender: {
              enabled: true,
              crawlLinks: true,
              concurrency: 14,
              failOnError: true,
              autoSubfolderIndex: true,
            },
            pages: slugs.map(s => ({ path: `/cours/${s}`, prerender: { enabled: true } })),
          }),
        ]),
    react(),
    tailwindcss(),
  ],
})
