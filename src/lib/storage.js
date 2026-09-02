import { currentMonthKey } from "./calc"

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
    done: {},
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
    done: raw.done && typeof raw.done === "object" ? raw.done : {},
    history: Array.isArray(raw.history) ? raw.history : [],
    version: SCHEMA_VERSION,
  }

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
    active: c.active !== false,
  }))

  data.budgets = data.budgets.map((b) => ({
    id: b.id || uid("b"),
    label: b.label ?? "Plaisirs communs",
    amount: b.amount ?? 0,
    frequency: b.frequency || "monthly",
    payer: b.payer && (b.payer === "joint" || knownIds.includes(b.payer)) ? b.payer : "joint",
    split: b.split || "inherit",
    customShares: b.customShares || {},
    note: b.note || "",
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
