import { round2, toMonthly } from "./calc"

export const realOf = (saved) =>
  saved == null ? null : typeof saved === "number" ? saved : (saved.real ?? null)

export function bilanLines(source, bucket = {}, { frozen = false } = {}) {
  const live = [
    ...(source.charges || [])
      .filter((c) => c.variable && c.active !== false)
      .map((c) => ({ ...c, owner: null })),
    ...(source.personal || []).filter((i) => i.variable && i.active !== false),
  ]
  const lines = live.map((item) => {
    const saved = bucket[item.id]
    const keep = frozen && saved && typeof saved === "object" && saved.planned != null
    const planned = keep ? saved.planned : round2(toMonthly(item.amount, item.frequency))
    return makeLine(item.id, item.label, item.category, item.owner, planned, realOf(saved))
  })
  const ids = new Set(live.map((i) => i.id))
  for (const [id, saved] of Object.entries(bucket)) {
    if (ids.has(id) || !saved || typeof saved !== "object") continue
    lines.push(
      makeLine(
        id,
        saved.label,
        saved.category,
        saved.owner ?? null,
        saved.planned ?? 0,
        realOf(saved),
      ),
    )
  }
  return lines
}

function makeLine(id, label, category, owner, planned, real) {
  return {
    id,
    label,
    category,
    owner: owner ?? null,
    planned,
    real,
    diff: real === null ? null : round2(real - planned),
  }
}

export function summarize(lines) {
  const filled = lines.filter((l) => l.real !== null)
  return {
    planned: round2(lines.reduce((s, l) => s + l.planned, 0)),
    real: round2(filled.reduce((s, l) => s + l.real, 0)),
    diff: round2(filled.reduce((s, l) => s + l.diff, 0)),
    count: filled.length,
  }
}

export function signed(value, money) {
  if (Math.abs(value) <= 0.005) return money(0)
  return `${value > 0 ? "+" : "−"}${money(Math.abs(value))}`
}
