import { createClient } from '@supabase/supabase-js'

/**
 * The single Supabase client for the browser.
 *
 * The missing-configuration case throws on load rather than at the first query.
 * A client built from an empty URL fails later, inside whatever screen happens
 * to query first, with an error that describes the symptom instead of the cause.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must both be set in .env.local. ' +
      'Copy .env.example and fill it from the project API settings.',
  )
}

export const supabase = createClient(url, anonKey)
