export type TypedOutput =
  | { type: 'image'; mime: string; data?: string; url?: string }
  | { type: 'curve'; points: number[] }
  | { type: 'metric'; value: number }
  | { type: 'metrics'; values: Record<string, number | string | boolean> }
  | { type: 'text'; text: string }
  | { type: 'gzip'; data: string }

export function parseOutput(raw: string): TypedOutput {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'type' in parsed) {
      return parsed as TypedOutput
    }
  } catch {
    /* pas du JSON -> texte */
  }
  return { type: 'text', text: raw }
}

export async function decodeOutput(raw: string): Promise<TypedOutput> {
  const parsed = parseOutput(raw)
  if (parsed.type !== 'gzip') return parsed
  try {
    const bin = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0))
    const stream = new DecompressionStream('gzip')
    const writer = stream.writable.getWriter()
    await writer.write(bin)
    await writer.close()
    const buf = await new Response(stream.readable).arrayBuffer()
    return parseOutput(new TextDecoder().decode(buf))
  } catch {
    return { type: 'text', text: '[sortie illisible]' }
  }
}
