import { REIMBURSEMENT, currentMonthKey, num, round2, toMonthly } from "./calc"

export const STORAGE_KEY = "walletOrg"
export const SCHEMA_VERSION = 1

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

export function defaultData() {
  return {
    version: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    settings: {
      currency: "EUR",
      locale: "fr-FR",
      defaultSplit: "prorata",
      theme: "light",
      householdName: "Notre foyer",
      jointAccountName: "Compte joint",
    },
    people: [
      {
        id: uid("p"),
        name: "Moi",
        netIncome: 2000,
        otherIncome: 0,
        color: "oklch(0.60 0.216 350)",
      },
      {
        id: uid("p"),
        name: "Mon copain",
        netIncome: 2600,
        otherIncome: 0,
        color: "oklch(0.60 0.17 300)",
      },
    ],
    charges: [],
    budgets: [],
    personal: [],
    savings: [],
    payments: [],
    actuals: {},
    history: [],
  }
}

const CATEGORY_RENAMES = {
  Energie: "Énergie",
  Telecom: "Télécom",
  Sante: "Santé",
  Impots: "Impôts",
  Epargne: "Épargne",
  Credit: "Crédit",
}

function fixCategory(value) {
  if (!value) return "Autre"
  return CATEGORY_RENAMES[value] || value
}

export function normalizeData(raw) {
  const base = defaultData()
  const data = {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings || {}) },
    people: Array.isArray(raw.people) ? raw.people : base.people,
    charges: Array.isArray(raw.charges) ? raw.charges : [],
    budgets: Array.isArray(raw.budgets) ? raw.budgets : [],
    personal: Array.isArray(raw.personal) ? raw.personal : [],
    savings: Array.isArray(raw.savings) ? raw.savings : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    actuals: raw.actuals && typeof raw.actuals === "object" ? raw.actuals : {},
    history: Array.isArray(raw.history) ? raw.history : [],
    version: SCHEMA_VERSION,
  }

  const legacyDeductions = data.people
    .filter((p) => p.id && num(p.deduction) > 0)
    .map((p) => ({
      id: uid("x"),
      label: "À retirer du calcul",
      amount: num(p.deduction),
      frequency: "monthly",
      owner: p.id,
      deduct: true,
    }))
  data.personal = [...legacyDeductions, ...data.personal]

  data.people = data.people.map((p, i) => ({
    id: p.id || uid("p"),
    name: p.name ?? `Personne ${i + 1}`,
    netIncome: p.netIncome ?? 0,
    otherIncome: p.otherIncome ?? 0,
    color: p.color || null,
  }))

  const knownIds = data.people.map((p) => p.id)

  data.charges = data.charges.map((c) => ({
    id: c.id || uid("c"),
    label: c.label ?? "Sans nom",
    amount: c.amount ?? 0,
    frequency: c.frequency || "monthly",
    payer: c.payer && (c.payer === "joint" || knownIds.includes(c.payer)) ? c.payer : "joint",
    split: c.split || "inherit",
    customShares: c.customShares || {},
    category: fixCategory(c.category),
    note: c.note || "",
    variable: c.variable === true,
    active: c.active !== false,
  }))

  const legacyDebts = (Array.isArray(raw.debts) ? raw.debts : [])
    .filter((d) => d && knownIds.includes(d.from) && knownIds.includes(d.to))
    .map((d) => ({
      id: d.id || uid("b"),
      label: d.label || "Remboursement",
      amount: d.amount ?? 0,
      month: d.month || currentMonthKey(),
      category: REIMBURSEMENT,
      from: d.from,
      to: d.to,
    }))
  data.budgets = [...data.budgets, ...legacyDebts]
  delete data.debts

  data.budgets = data.budgets.map((b) => ({
    id: b.id || uid("b"),
    label: b.label ?? "Plaisirs communs",
    amount: b.month ? b.amount ?? 0 : round2(toMonthly(b.amount, b.frequency)),
    frequency: "monthly",
    payer: b.payer && (b.payer === "joint" || knownIds.includes(b.payer)) ? b.payer : "joint",
    split: b.split || "inherit",
    customShares: b.customShares || {},
    category: fixCategory(b.category),
    note: b.note || "",
    month: b.month || currentMonthKey(),
    from: knownIds.includes(b.from) ? b.from : knownIds[0] ?? null,
    to: knownIds.includes(b.to) ? b.to : knownIds[1] ?? null,
    active: b.active !== false,
  }))

  data.personal = data.personal.map((i) => ({
    id: i.id || uid("x"),
    label: i.label ?? "Charge perso",
    amount: i.amount ?? 0,
    frequency: i.frequency || "monthly",
    owner: knownIds.includes(i.owner) ? i.owner : knownIds[0],
    category: fixCategory(i.category),
    note: i.note || "",
    deduct: i.deduct === true,
    variable: i.variable === true,
    active: i.active !== false,
  }))

  data.savings = data.savings.map((e) => ({
    id: e.id || uid("s"),
    month: e.month || currentMonthKey(),
    amount: e.amount ?? 0,
    kind: e.kind === "withdrawal" ? "withdrawal" : "deposit",
    note: e.note || "",
    createdAt: e.createdAt || new Date().toISOString(),
    active: e.active !== false,
  }))

  const legacyDone = raw.done && typeof raw.done === "object" ? raw.done : {}
  const alreadyMigrated = new Set(data.payments.map((p) => `${p.month}|${p.transferId}`))
  for (const [month, bucket] of Object.entries(legacyDone)) {
    for (const [transferId, entry] of Object.entries(bucket || {})) {
      if (alreadyMigrated.has(`${month}|${transferId}`)) continue
      data.payments.push({
        id: uid("v"),
        month,
        transferId,
        amount: num(entry?.amount),
        at: entry?.at || new Date().toISOString(),
      })
    }
  }
  delete data.done

  data.payments = data.payments
    .filter((p) => p && p.month && p.transferId)
    .map((p) => ({
      id: p.id || uid("v"),
      month: p.month,
      transferId: p.transferId,
      amount: num(p.amount),
      at: p.at || new Date().toISOString(),
    }))

  data.actuals = Object.fromEntries(
    Object.entries(data.actuals)
      .filter(([, bucket]) => bucket && typeof bucket === "object")
      .map(([month, bucket]) => [
        month,
        Object.fromEntries(
          Object.entries(bucket)
            .filter(([, v]) => v !== null && v !== "" && Number.isFinite(num(v)))
            .map(([id, v]) => [id, num(v)])
        ),
      ])
  )

  data.history = data.history
    .filter((h) => h && h.month)
    .map((h) => ({
      id: h.id || uid("h"),
      month: h.month || currentMonthKey(),
      savedAt: h.savedAt || new Date().toISOString(),
      summary: h.summary || null,
      snapshot: h.snapshot || null,
    }))

  return data
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return defaultData()
    return normalizeData(parsed)
  } catch {
    return defaultData()
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, version: SCHEMA_VERSION, updatedAt: new Date().toISOString() })
    )
    return true
  } catch {
    return false
  }
}

export function clearData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* rien à faire */
  }
}
