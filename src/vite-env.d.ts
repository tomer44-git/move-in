/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The Supabase project URL. Public by design; it appears in every request. */
  readonly VITE_SUPABASE_URL: string
  /**
   * The browser-side key. Row level security is what protects the data, not the
   * secrecy of this value. Holds either the legacy `anon` key or the newer
   * publishable key - they fill the same slot.
   */
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
