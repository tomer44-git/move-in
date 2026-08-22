import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Profile = {
  id: string
  display_name: string
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; profile: Profile }
  | { status: 'error'; message: string }

/**
 * Who is signed in, and what they are called.
 *
 * The name is read from `public.profile` rather than from the token, because the
 * board names owners from that table and a name taken from the token would hide
 * a trigger that never fired. The missing-row case is reported rather than
 * papered over.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null)
  const [authSettled, setAuthSettled] = useState(false)
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  // Auth events only. Nothing is awaited inside this callback: supabase-js holds
  // an internal lock while it runs, and awaiting a query here can deadlock the
  // client. The profile is fetched in the effect below instead.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthSettled(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authSettled) return

    if (!session) {
      setState({ status: 'signed_out' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    void supabase
      .from('profile')
      .select('id, display_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return

        if (error) {
          setState({ status: 'error', message: error.message })
          return
        }

        if (!data) {
          setState({
            status: 'error',
            message:
              'ההתחברות הצליחה, אבל לא נמצאה שורה מתאימה בטבלת profile. ' +
              'הטריגר on_auth_user_created לא פעל.',
          })
          return
        }

        setState({ status: 'signed_in', profile: data })
      })

    return () => {
      cancelled = true
    }
  }, [authSettled, session])

  return state
}

/**
 * Starts the Google flow. The browser leaves the page at this point and comes
 * back to `redirectTo`, which is why nothing after the call runs on success.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
