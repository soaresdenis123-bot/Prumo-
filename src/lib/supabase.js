import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no ambiente.')
}

export const supabase = createClient(url, anon)
