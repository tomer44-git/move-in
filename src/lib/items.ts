import { CATALOGUE } from '../catalogue/items'
import { supabase } from './supabase'

export type ItemState = 'not_started' | 'request_sent' | 'confirmed'

export type MoveItem = {
  id: string
  move_id: string
  catalogue_key: string | null
  custom_title: string | null
  position: number
  state: ItemState
  owner_id: string | null
  request_sent_at: string | null
  confirmed_at: string | null
  confirmation: string | null
  reference: string | null
  updated_at: string
  updated_by: string | null
}

const COLUMNS =
  'id, move_id, catalogue_key, custom_title, position, state, owner_id, request_sent_at, confirmed_at, confirmation, reference, updated_at, updated_by'

/**
 * Creates the nineteen rows for a move.
 *
 * The keys come from the catalogue in git, which is why this runs in the browser
 * rather than in the database: the database has never been told what is on the
 * verified list, and giving it a copy would create a second place for the list
 * to be wrong.
 *
 * Safe to call again. A unique index on (move_id, catalogue_key) means a repeat
 * inserts nothing, so an interrupted seed is fixed by repeating it.
 */
export async function seedItems(moveId: string): Promise<void> {
  const rows = CATALOGUE.map((item) => ({
    move_id: moveId,
    catalogue_key: item.key,
    position: item.position,
  }))

  const { error } = await supabase
    .from('move_item')
    .upsert(rows, { onConflict: 'move_id,catalogue_key', ignoreDuplicates: true })

  if (error) throw new Error(error.message)
}

export async function listItems(moveId: string): Promise<MoveItem[]> {
  const { data, error } = await supabase
    .from('move_item')
    .select(COLUMNS)
    .eq('move_id', moveId)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as MoveItem[]
}
