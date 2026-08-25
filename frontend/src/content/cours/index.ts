import { z } from 'zod'

export const DifficultySchema = z.enum(['facile', 'moyen', 'difficile'])
export type Difficulty = z.infer<typeof DifficultySchema>

const ExpectedSchema = z.object({
  nodes: z.array(z.object({ id: z.string(), type: z.string() })),
  edges: z.array(z.object({ from: z.string(), fromPort: z.string().optional(), to: z.string(), toPort: z.string().optional() })),
  hints: z.record(z.string(), z.string()),
})

const CourseMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: DifficultySchema,
  description: z.string(),
  seo: z.union([z.object({ title: z.string().optional(), description: z.string().optional() }), z.string()]).optional(),
  expected: ExpectedSchema,
})

export type CourseMeta = z.infer<typeof CourseMetaSchema> & {
  slug: string
  body: string
  sections: { id: string; title: string }[]
}

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function uniqueSlug(base: string, counts: Map<string, number>): string {
  const fallback = base || 'section'
  const count = counts.get(fallback) ?? 0
  counts.set(fallback, count + 1)
  return count === 0 ? fallback : `${fallback}-${count}`
}

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const lines = yaml.split('\n')
  const root: Record<string, unknown> = {}
  type StackEntry = { indent: number; container: unknown; key?: string }
  const stack: StackEntry[] = [{ indent: -1, container: root }]
  const parseValue = (v: string): string => {
    let s = v.trim()
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1)
    return s
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.search(/\S/)
    const trimmed = line.trim()
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop()
    const parent = stack[stack.length - 1].container as Record<string, unknown> | unknown[]
    if (trimmed.startsWith('- ')) {
      const arr = parent as unknown[]
      if (!Array.isArray(arr)) continue
      const rest = trimmed.slice(2).trim()
      if (rest === '') {
        const obj: Record<string, unknown> = {}
        arr.push(obj)
        stack.push({ indent, container: obj })
      } else if (rest.includes(':')) {
        const c = rest.indexOf(':')
        const k = rest.slice(0, c).trim()
        const v = rest.slice(c + 1).trim()
        const obj: Record<string, unknown> = {}
        if (v !== '') obj[k] = parseValue(v)
        arr.push(obj)
        stack.push({ indent, container: obj })
        // if value was empty, next lines will fill that key as container – but our files always have value on same line for first key
        // handle empty value case: push container for k
        if (v === '') {
          // look ahead to decide array vs object
          let j = i + 1
          while (j < lines.length && !lines[j].trim()) j++
          if (j < lines.length) {
            const nt = lines[j].trim()
            if (nt.startsWith('- ')) {
              const a: unknown[] = []
              obj[k] = a
              stack.push({ indent: indent + 2, container: a })
            } else {
              const o: Record<string, unknown> = {}
              obj[k] = o
              stack.push({ indent: indent + 2, container: o })
            }
          }
        }
      } else {
        arr.push(parseValue(rest))
      }
    } else if (trimmed.includes(':')) {
      const c = trimmed.indexOf(':')
      const k = trimmed.slice(0, c).trim()
      const v = trimmed.slice(c + 1).trim()
      const p = parent as Record<string, unknown>
      if (v !== '') {
        p[k] = parseValue(v)
      } else {
        let j = i + 1
        while (j < lines.length && !lines[j].trim()) j++
        if (j < lines.length) {
          const nt = lines[j].trim()
          if (nt.startsWith('- ')) {
            const a: unknown[] = []
            p[k] = a
            stack.push({ indent, container: a })
          } else {
            const o: Record<string, unknown> = {}
            p[k] = o
            stack.push({ indent, container: o })
          }
        } else {
          p[k] = {}
          stack.push({ indent, container: p[k] })
        }
      }
    }
  }
  return root
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) return { data: {}, content: raw }
  try {
    const data = parseSimpleYaml(m[1])
    return { data, content: m[2].trim() }
  } catch {
    return { data: {}, content: m[2].trim() }
  }
}

function extractSections(body: string): { id: string; title: string }[] {
  const counts = new Map<string, number>()
  const sections: { id: string; title: string }[] = []
  for (const line of body.split('\n')) {
    const mm = line.match(/^##\s+(.+)$/)
    if (!mm) continue
    const title = mm[1].trim()
    const base = slugify(title)
    const id = uniqueSlug(base, counts)
    sections.push({ id, title })
  }
  return sections
}

const rawModules = import.meta.glob('./*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function buildCourses(): CourseMeta[] {
  const out: CourseMeta[] = []
  for (const [path, raw] of Object.entries(rawModules)) {
    const slug = path.replace(/^\.\//, '').replace(/\.md$/, '')
    const { data, content } = parseFrontmatter(raw as string)
    // allow id fallback to slug
    if (!data.id) (data as Record<string, unknown>).id = slug
    const parsed = CourseMetaSchema.safeParse(data)
    if (!parsed.success) {
      console.warn(`[cours] invalid frontmatter ${slug}:`, parsed.error.flatten())
      continue
    }
    const sections = extractSections(content)
    out.push({ ...parsed.data, slug, body: content, sections })
  }
  return out
}

export const courses: CourseMeta[] = buildCourses()

export function getCourse(slug: string): CourseMeta | undefined {
  return courses.find(c => c.slug === slug || c.id === slug)
}

export function searchCourses(q: string, difficulty?: string): CourseMeta[] {
  const query = q.trim().toLowerCase()
  return courses.filter(c => {
    const matchQ = !query || c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
    const matchD = !difficulty || difficulty === 'Tous' || difficulty === 'all' || c.difficulty === difficulty
    return matchQ && matchD
  })
}
