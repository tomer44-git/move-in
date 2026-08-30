import { supabase } from './supabase'

export type ItemEvent = {
  id: string
  at: string
  action: string
  /** Who did it. Null on lines written before the column existed. */
  actor_id: string | null
}

/**
 * What happened to an item, newest first.
 *
 * Read when a person opens the log rather than for the whole board on load: most
 * items will never be asked, and nineteen histories fetched to show none of them
 * is nineteen queries wasted.
 */
export async function itemEvents(itemId: string): Promise<ItemEvent[]> {
  const { data, error } = await supabase
    .from('move_item_event')
    .select('id, at, action, actor_id')
    .eq('move_item_id', itemId)
    .order('at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ItemEvent[]
}
