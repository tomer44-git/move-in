import { supabase } from './supabase'

export type Person = { id: string; display_name: string }

/**
 * Everyone on this move, by id.
 *
 * Two queries rather than an embedded join: PostgREST returns an embedded
 * relation as an array whether or not it can be one, and flattening that costs
 * more clarity than a second round trip is worth.
 *
 * Row level security allows a person to read the profile of anyone they share a
 * move with, which is what lets the board name an owner rather than show a bare
 * identifier.
 */
export async function peopleOnMove(moveId: string): Promise<Map<string, Person>> {
  const members = await supabase
    .from('move_member')
    .select('profile_id')
    .eq('move_id', moveId)

  if (members.error) throw new Error(members.error.message)

  const ids = (members.data ?? []).map((row) => row.profile_id as string)
  if (ids.length === 0) return new Map()

  const profiles = await supabase
    .from('profile')
    .select('id, display_name')
    .in('id', ids)

  if (profiles.error) throw new Error(profiles.error.message)

  return new Map(
    ((profiles.data ?? []) as Person[]).map((person) => [person.id, person]),
  )
}
