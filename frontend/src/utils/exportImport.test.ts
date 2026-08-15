import { describe, it, expect } from 'vitest'
import { parseImportFile, slugify, pipelineToJson } from './exportImport'

const fakeFile = (name: string, content: string): File =>
  ({ name, text: () => Promise.resolve(content) }) as unknown as File

describe('parseImportFile', () => {
  it('rejects invalid JSON with a French error', async () => {
    await expect(parseImportFile(fakeFile('p.json', '{nope'))).rejects.toThrow('Fichier JSON invalide.')
  })

  it('rejects payloads without nodes/edges arrays', async () => {
    await expect(parseImportFile(fakeFile('p.json', '{}'))).rejects.toThrow('Format MLBlock invalide')
    await expect(parseImportFile(fakeFile('p.json', '{"name":"x"}'))).rejects.toThrow('Format MLBlock invalide')
    await expect(parseImportFile(fakeFile('p.json', 'null'))).rejects.toThrow('Format MLBlock invalide')
    await expect(parseImportFile(fakeFile('p.json', '{"nodes":{},"edges":[]}'))).rejects.toThrow(
      'Format MLBlock invalide'
    )
    await expect(parseImportFile(fakeFile('p.json', '{"nodes":[],"edges":{}}'))).rejects.toThrow(
      'Format MLBlock invalide'
    )
  })

  it('rejects nodes missing id or type', async () => {
    await expect(parseImportFile(fakeFile('p.json', '{"nodes":[{"type":"x"}],"edges":[]}'))).rejects.toThrow(
      'chaque nœud doit avoir « id » et « type »'
    )
    await expect(parseImportFile(fakeFile('p.json', '{"nodes":[{"id":"n1"}],"edges":[]}'))).rejects.toThrow(
      'chaque nœud doit avoir « id » et « type »'
    )
  })

  it('parses a valid MLBlock file completely', async () => {
    const content = JSON.stringify({
      name: 'mon-projet',
      nodes: [
        { id: 'n1', type: 'csv', params: { path: 'a.csv' }, children: [{ id: 'c1', type: 'x' }], position: { x: 10, y: 20 } },
        { id: 'n2', type: 'model' },
      ],
      edges: [{ source: 'n1', source_port: 'out_1', target: 'n2', target_port: 'in_1' }],
    })
    const p = await parseImportFile(fakeFile('ignored.json', content))
    expect(p.name).toBe('mon-projet')
    expect(p.nodes).toEqual([
      { id: 'n1', type: 'csv', params: { path: 'a.csv' }, children: [{ id: 'c1', type: 'x' }], position: { x: 10, y: 20 } },
      { id: 'n2', type: 'model', params: {}, children: [] },
    ])
    expect(p.edges).toEqual([{ source: 'n1', source_port: 'out_1', target: 'n2', target_port: 'in_1' }])
  })

  it('falls back to the filename (without extension) when name is missing or blank', async () => {
    const body = JSON.stringify({ nodes: [], edges: [] })
    await expect(parseImportFile(fakeFile('mon-projet.json', body))).resolves.toMatchObject({ name: 'mon-projet' })

    const blank = JSON.stringify({ name: '   ', nodes: [], edges: [] })
    await expect(parseImportFile(fakeFile('sans-nom.JSON', blank))).resolves.toMatchObject({ name: 'sans-nom' })
  })

  it('applies default port values and empty string fallbacks on edges', async () => {
    const content = JSON.stringify({
      nodes: [],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'x', source_port: 'custom_out', target: 'y', target_port: 'custom_in' },
      ],
    })
    const p = await parseImportFile(fakeFile('p.json', content))
    expect(p.edges[0]).toEqual({ source: 'a', source_port: 'out_1', target: 'b', target_port: 'in_1' })
    expect(p.edges[1]).toEqual({ source: 'x', source_port: 'custom_out', target: 'y', target_port: 'custom_in' })
  })

  it('defaults missing node params/children and coerces missing edge endpoints to empty strings', async () => {
    const content = JSON.stringify({
      nodes: [{ id: 'n1', type: 'csv' }],
      edges: [{ target_port: 'in_9' }],
    })
    const p = await parseImportFile(fakeFile('p.json', content))
    expect(p.nodes[0]).toEqual({ id: 'n1', type: 'csv', params: {}, children: [] })
    expect(p.edges[0]).toEqual({ source: '', source_port: 'out_1', target: '', target_port: 'in_9' })
  })
})

describe('slugify', () => {
  it('lowercases and replaces separators', () => {
    expect(slugify('Mon Projet ML')).toBe('mon-projet-ml')
    expect(slugify('Tout__en---un!')).toBe('tout-en-un')
    expect(slugify('')).toBe('projet')
  })
})

describe('pipelineToJson', () => {
  it('serializes name/nodes/edges symmetrically with the importer', async () => {
    const json = pipelineToJson('p', [{ id: 'n1', type: 'csv', params: {}, children: [] }], [
      { source: 'n1', source_port: 'out_1', target: 'n2', target_port: 'in_1' },
    ])
    const p = await parseImportFile(fakeFile('p.json', json))
    expect(p.name).toBe('p')
    expect(p.nodes[0]).toEqual({ id: 'n1', type: 'csv', params: {}, children: [] })
    expect(p.edges[0]).toEqual({ source: 'n1', source_port: 'out_1', target: 'n2', target_port: 'in_1' })
  })
})
