import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

export function calcPts(pA, pB, rA, rB) {
  if (rA === null || rA === undefined) return null
  if (pA === rA && pB === rB) return 6
  if ((rA - rB) === 0 && (pA - pB) === 0) return 4
  if ((pA - pB) === (rA - rB)) return 4
  return 0
}

export function groupByDate(matches) {
  const map = {}
  matches.forEach(m => {
    const key = m.date_label
    if (!map[key]) map[key] = { date: m.date_label, iso: m.iso_date, stage: m.stage, matches: [] }
    map[key].matches.push(m)
  })
  return Object.values(map)
}
