import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockHttp } = vi.hoisted(() => ({
  mockHttp: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

vi.mock('axios', () => ({ default: { create: () => mockHttp } }))

import {
  requestUpload,
  confirmUpload,
  listFiles,
  previewFile,
  deleteFile,
  isFileAssetExpired,
  acceptsFile,
  type FileAssetItem,
} from './client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('file assets api', () => {
  it('requestUpload envoie nom/taille/mime/block_type et rend signed_url', async () => {
    mockHttp.post.mockResolvedValue({
      data: { id: 'a1', signed_url: 'https://sign/u', expires_at: '2030-01-01' },
    })
    const res = await requestUpload({ name: 'd.csv', size_bytes: 8, mime: 'text/csv', block_type: 'load_csv' })
    expect(mockHttp.post).toHaveBeenCalledWith('/api/files/request-upload', {
      name: 'd.csv',
      size_bytes: 8,
      mime: 'text/csv',
      block_type: 'load_csv',
    })
    expect(res).toEqual({ id: 'a1', signed_url: 'https://sign/u', expires_at: '2030-01-01' })
  })

  it('confirmUpload rend public_url, kind et preview', async () => {
    mockHttp.post.mockResolvedValue({
      data: { id: 'a1', public_url: 'https://pub/u/d.csv', kind: 'csv', preview: { rows: [['a'], ['1']] } },
    })
    const res = await confirmUpload('a1')
    expect(mockHttp.post).toHaveBeenCalledWith('/api/files/a1/confirm')
    expect(res.public_url).toBe('https://pub/u/d.csv')
    expect(res.preview.rows).toEqual([['a'], ['1']])
  })

  it('listFiles rend la galerie', async () => {
    const items: FileAssetItem[] = [
      { id: 'a1', name: 'd.csv', size_bytes: 8, kind: 'csv', public_url: 'https://pub/u/d.csv', expires_at: '2030-01-01' },
    ]
    mockHttp.get.mockResolvedValue({ data: items })
    await expect(listFiles()).resolves.toEqual(items)
    expect(mockHttp.get).toHaveBeenCalledWith('/api/files')
  })

  it('previewFile et deleteFile appellent les bonnes routes', async () => {
    mockHttp.get.mockResolvedValue({ data: { kind: 'image', url: 'https://pub/u/i.png' } })
    await expect(previewFile('a9')).resolves.toEqual({ kind: 'image', url: 'https://pub/u/i.png' })
    mockHttp.delete.mockResolvedValue({ data: null })
    await expect(deleteFile('a9')).resolves.toBeUndefined()
    expect(mockHttp.delete).toHaveBeenCalledWith('/api/files/a9')
  })

  it('une URL user-uploads absente de la galerie est marquée expirée', () => {
    const assets: FileAssetItem[] = [
      { id: 'a1', name: 'd.csv', size_bytes: 8, kind: 'csv', public_url: 'https://x/storage/v1/object/public/user-uploads/u/d.csv', expires_at: '2030-01-01' },
    ]
    expect(isFileAssetExpired('https://x/storage/v1/object/public/user-uploads/u/gone.csv', assets, true)).toBe(true)
    expect(isFileAssetExpired('https://x/storage/v1/object/public/user-uploads/u/d.csv', assets, true)).toBe(false)
    expect(isFileAssetExpired('https://x/storage/v1/object/public/sample-data/iris.csv', assets, true)).toBe(false)
    expect(isFileAssetExpired('https://x/storage/v1/object/public/user-uploads/u/gone.csv', assets, false)).toBe(false)
    expect(isFileAssetExpired('', assets, true)).toBe(false)
  })

  it('acceptsFile refuse un drop hors accept avant tout upload', () => {
    expect(acceptsFile('.csv', 'd.csv')).toBe(true)
    expect(acceptsFile('.csv|.txt', 'n.txt')).toBe(true)
    expect(acceptsFile('.png|.jpg', 'photo.jpg')).toBe(true)
    expect(acceptsFile('.csv', 'img.png')).toBe(false)
    expect(acceptsFile('', 'nimporte quoi.bin')).toBe(true)
  })
})
