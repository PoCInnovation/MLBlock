import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.join(__dirname, '../src/content/cours')
const distDir = path.join(__dirname, '../dist')
const base = process.env.SITE_URL || 'https://mlblock-frontend.onrender.com'

export function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { title: '', description: '' }
  const yaml = match[1]
  const titleMatch = yaml.match(/^title:\s*(.+)$/m)
  const descMatch = yaml.match(/^description:\s*(.+)$/m)
  const clean = (s) => (s ? s.trim().replace(/^['"]|['"]$/g, '') : '')
  return {
    title: clean(titleMatch?.[1]),
    description: clean(descMatch?.[1]),
  }
}

export function injectCourseHead(templateHtml, { title, description, slug, base }) {
  const fullTitle = title.includes('— MLBlock') ? title : `${title} — MLBlock`
  const escapedTitle = fullTitle.replace(/"/g, '&quot;')
  const escapedDesc = (description || '').replace(/"/g, '&quot;')
  const url = slug ? `${base}/cours/${slug}` : `${base}/cours`

  let html = templateHtml

  // Replace title
  if (html.includes('<title>')) {
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`)
  } else {
    html = html.replace('</head>', `  <title>${escapedTitle}</title>\n</head>`)
  }

  const headInjections = `
    <meta name="description" content="${escapedDesc}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${base}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />
    <link rel="canonical" href="${url}" />
    <script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: title,
  description: description || '',
  provider: {
    '@type': 'Organization',
    name: 'MLBlock',
    url: base,
  },
}, null, 2)}
    </script>
  `

  return html.replace('</head>', `${headInjections}\n</head>`)
}

function getCourses() {
  if (!fs.existsSync(contentDir)) return []
  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const slug = f.replace(/\.md$/, '')
      const content = fs.readFileSync(path.join(contentDir, f), 'utf-8')
      const { title, description } = extractFrontmatter(content)
      return { slug, title: title || slug, description }
    })
}

// Main execution when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const courses = getCourses()
  const slugs = courses.map(c => c.slug)
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

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap)
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots)
  fs.writeFileSync(path.join(distDir, 'llms.txt'), llms)
  console.log(`[seo] wrote sitemap/robots/llms to ${distDir}`)

  const templatePath = path.join(distDir, 'index.html')
  if (fs.existsSync(templatePath)) {
    const templateHtml = fs.readFileSync(templatePath, 'utf-8')

    // Generate dist/cours/index.html
    const coursDir = path.join(distDir, 'cours')
    if (!fs.existsSync(coursDir)) fs.mkdirSync(coursDir, { recursive: true })

    const catalogueHtml = injectCourseHead(templateHtml, {
      title: 'Catalogue des cours',
      description: 'Découvrez tous nos cours interactifs pour apprendre le Machine Learning sans coder.',
      slug: '',
      base
    })
    fs.writeFileSync(path.join(coursDir, 'index.html'), catalogueHtml)
    console.log(`[seo] wrote dist/cours/index.html`)

    // Generate dist/cours/<slug>/index.html
    for (const course of courses) {
      const courseSlugDir = path.join(coursDir, course.slug)
      if (!fs.existsSync(courseSlugDir)) fs.mkdirSync(courseSlugDir, { recursive: true })

      const courseHtml = injectCourseHead(templateHtml, {
        title: course.title,
        description: course.description,
        slug: course.slug,
        base
      })
      fs.writeFileSync(path.join(courseSlugDir, 'index.html'), courseHtml)
      console.log(`[seo] wrote dist/cours/${course.slug}/index.html`)
    }
  } else {
    console.warn(`[seo] Warning: ${templatePath} not found, skipping course HTML generation.`)
  }
}
