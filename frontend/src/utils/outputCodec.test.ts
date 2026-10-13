import { describe, it, expect } from 'vitest'
import { decodeOutput } from './outputCodec'

async function envelope(payload: unknown): Promise<string> {
  const stream = new CompressionStream('gzip')
  const writer = stream.writable.getWriter()
  await writer.write(new TextEncoder().encode(JSON.stringify(payload)))
  await writer.close()
  const buf = await new Response(stream.readable).arrayBuffer()
  const bytes = new Uint8Array(buf)
  let bin = ''
  bytes.forEach(b => {
    bin += String.fromCharCode(b)
  })
  return JSON.stringify({ type: 'gzip', data: btoa(bin) })
}

describe('decodeOutput', () => {
  it('decodes a gzip envelope back to the typed payload', async () => {
    const out = await decodeOutput(await envelope({ type: 'curve', points: [1.2, 0.8, 0.4] }))
    expect(out).toEqual({ type: 'curve', points: [1.2, 0.8, 0.4] })
  })

  it('passes plain payloads through parseOutput', async () => {
    expect(await decodeOutput(JSON.stringify({ type: 'metric', value: 0.5 }))).toEqual({
      type: 'metric',
      value: 0.5,
    })
    expect(await decodeOutput('hello')).toEqual({ type: 'text', text: 'hello' })
  })
})
