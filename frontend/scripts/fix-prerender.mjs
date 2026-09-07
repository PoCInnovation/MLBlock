import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distClient = path.join(__dirname, '../dist/client')
const templatePath = path.join(__dirname, '../index.html')

if (!fs.existsSync(distClient)) {
  console.log('[fix-prerender] dist/client missing, skip')
  process.exit(0)
}

// extract <head> from template for fonts / meta - dedupe charset/viewport
let templateHead = ''
if (fs.existsSync(templatePath)) {
  const tpl = fs.readFileSync(templatePath, 'utf8')
  const m = tpl.match(/<head>([\s\S]*?)<\/head>/i)
  if (m) {
    templateHead = m[1]
      .split('\n')
      .filter(l => !/charset|viewport/i.test(l))
      .join('\n')
      .trim()
  }
}

const assetsDir = path.join(distClient, 'assets')
const cssFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter(f => f.endsWith('.css')) : []
const jsEntry = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).find(f => /^index-.*\.js$/.test(f)) : null

const cssLinks = cssFiles.map(f => `    <link rel="stylesheet" href="/assets/${f}">`).join('\n')

function isFragment(html) {
  const t = html.trimStart()
  return t.startsWith('<!--') || t.startsWith('<link') || t.startsWith('<div') || !t.toLowerCase().startsWith('<!doctype')
}

function wrap(html) {
  const headExtra = cssLinks + (jsEntry ? `\n    <script type="module" src="/assets/${jsEntry}"><\/script>` : '')
  return `<!DOCTYPE html>
<html lang="fr" data-astryx-theme="neutral" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${templateHead ? templateHead.split('\n').map(l => '    ' + l.trim()).join('\n') + '\n' : ''}${headExtra}
  </head>
  <body>
    <div id="root">${html}</div>
  </body>
</html>
`
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.isFile() && ent.name.endsWith('.html')) {
      const html = fs.readFileSync(p, 'utf8')
      if (isFragment(html)) {
        fs.writeFileSync(p, wrap(html))
        console.log(`[fix-prerender] wrapped ${path.relative(distClient, p)}`)
      }
    }
  }
}

walk(distClient)
console.log(`[fix-prerender] done css=${cssFiles.join(',')} js=${jsEntry}`)
