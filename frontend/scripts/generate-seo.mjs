import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.join(__dirname, '../src/content/cours')
const distDir = path.join(__dirname, '../dist')
const distClientDir = path.join(__dirname, '../dist/client')
const publicDir = path.join(__dirname, '../public')
const base = process.env.SITE_URL || 'https://mlblock-frontend.onrender.com'

function getSlugs() {
  if (!fs.existsSync(contentDir)) return []
  return fs.readdirSync(contentDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
}

const slugs = getSlugs()
const urls = ['/', '/cours', ...slugs.map(s => `/cours/${s}`)]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`

const llms = `# Cours
${slugs.map(s => `- [${s}](${base}/cours/${s})`).join('\n')}
`

for (const dir of [distDir, distClientDir, publicDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap)
  fs.writeFileSync(path.join(dir, 'robots.txt'), robots)
  fs.writeFileSync(path.join(dir, 'llms.txt'), llms)
  console.log(`[seo] wrote sitemap/robots/llms to ${dir}`)
}
