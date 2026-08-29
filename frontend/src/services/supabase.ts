import { createClient } from '@supabase/supabase-js'

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const VITE_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

// ponytail: placeholder URL/key avoids throw during SSG prerender when env absent (CI/Render build without secrets)
export const supabase = createClient(
  VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder',
)

export async function uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}
