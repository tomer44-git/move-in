/**
 * How long an item has been waiting, in Hebrew.
 *
 * Computed from `request_sent_at` every time it is shown, never stored, so it
 * cannot go stale. Days are counted by calendar day rather than by 24-hour
 * blocks: a request sent yesterday evening reads as "אתמול" this morning, which
 * is what a person means by it.
 */
export function waitingLabel(sentAt: string, now: Date = new Date()): string {
  const sent = new Date(sentAt)
  const days = calendarDaysBetween(sent, now)

  if (days <= 0) return 'נשלח היום'
  if (days === 1) return 'ממתין מאתמול'
  if (days === 2) return 'ממתין יומיים'
  return `ממתין ${days} ימים`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const calendarDaysBetween = (from: Date, to: Date): number => {
  const startOfDay = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY)
}

/**
 * A date, as a person writing it by hand would.
 *
 * Shown beside the elapsed time rather than instead of it: "three days" and
 * "the 24th" answer different questions, and a week of use had both being asked.
 */
export const shortDate = (at: string): string =>
  new Date(at).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
