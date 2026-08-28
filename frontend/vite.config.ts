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

// ponytail: SSG only — Start prerender static (no SSR). sitemap via Start, llms via generate-seo.mjs
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
      sitemap: {
        enabled: true,
        host: 'https://mlblock-frontend.onrender.com',
      },
      pages: slugs.map(s => ({ path: `/cours/${s}`, prerender: { enabled: true } })),
    }),
    react(),
    tailwindcss(),
  ],
})
