/**
 * Asserts that every `source` string in the catalogue still appears in
 * docs/items.md.
 *
 * The catalogue is read as text rather than imported, so this needs no compiler
 * and no dependency. It proves one thing only: that the English transcription
 * has not drifted from the document. It cannot check the Hebrew, which has no
 * source to check against.
 */
import { readFileSync } from 'node:fs'

const DOC = 'docs/items.md'
const FILES = ['src/catalogue/items.ts', 'src/catalogue/routes.ts']

/** Markdown emphasis and code ticks are formatting, not wording. */
const normalise = (text) =>
  text.replace(/[*`]/g, '').replace(/\s+/g, ' ').trim()

const doc = normalise(readFileSync(DOC, 'utf8'))

/** Every string literal inside a `source:` or `_SOURCE` array. */
function sourceStrings(file) {
  const text = readFileSync(file, 'utf8')
  const arrays = text.matchAll(/(?:source|_SOURCE[^=]*=)\s*:?\s*\[([\s\S]*?)\]/g)
  const found = []
  for (const [, body] of arrays) {
    for (const [, single, double] of body.matchAll(
      /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g,
    )) {
      found.push((single ?? double).replace(/\\(['"])/g, '$1'))
    }
  }
  return found
}

const missing = []
let checked = 0

for (const file of FILES) {
  for (const string of sourceStrings(file)) {
    checked += 1
    if (!doc.includes(normalise(string))) missing.push({ file, string })
  }
}

if (missing.length > 0) {
  console.error(`${missing.length} of ${checked} source strings are not in ${DOC}:\n`)
  for (const { file, string } of missing) console.error(`  ${file}\n    ${string}\n`)
  process.exit(1)
}

console.log(`${checked} source strings all present in ${DOC}.`)
