import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const coursDir = path.join(__dirname, 'src/content/cours')
const slugs = fs.existsSync(coursDir) ? fs.readdirSync(coursDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) : []

// ponytail: fs scan here is build-time prerender discovery — vite.config runs in Node before src/content/cours can be imported
export default defineConfig({
  plugins: [
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
    react(),
    tailwindcss(),
  ],
})
