export const JOINT = "joint"
export const REIMBURSEMENT = "Remboursement"

export function isReimbursement(item) {
  return item?.category === REIMBURSEMENT
}

export const FREQUENCIES = [
  { value: "monthly", label: "par mois", short: "/mois", perMonth: 1 },
  { value: "weekly", label: "par semaine", short: "/sem.", perMonth: 52 / 12 },
  { value: "bimonthly", label: "tous les 2 mois", short: "/2 mois", perMonth: 1 / 2 },
  { value: "quarterly", label: "par trimestre", short: "/trim.", perMonth: 1 / 3 },
  { value: "biannual", label: "tous les 6 mois", short: "/6 mois", perMonth: 1 / 6 },
  { value: "yearly", label: "par an", short: "/an", perMonth: 1 / 12 },
]

export const SPLIT_MODES = [
  { value: "prorata", label: "Au prorata des revenus" },
  { value: "equal", label: "Moitié-moitié" },
  { value: "custom", label: "Pourcentages manuels" },
]

export const PERSON_COLORS = [
  "oklch(0.60 0.216 350)",
  "oklch(0.60 0.17 300)",
  "oklch(0.62 0.14 230)",
  "oklch(0.66 0.15 45)",
]

export function frequencyOf(value) {
  return FREQUENCIES.find((f) => f.value === value) || FREQUENCIES[0]
}

export function toMonthly(amount, frequency) {
  return num(amount) * frequencyOf(frequency).perMonth
}

export function num(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function incomeOf(person) {
  return num(person.netIncome) + num(person.otherIncome)
}

function normalizeWeights(raw, ids) {
  const total = ids.reduce((s, id) => s + Math.max(0, num(raw[id])), 0)
  if (total <= 0) {
    const even = ids.length ? 1 / ids.length : 0
    return Object.fromEntries(ids.map((id) => [id, even]))
  }
  return Object.fromEntries(ids.map((id) => [id, Math.max(0, num(raw[id])) / total]))
}

function distribute(total, ids, weights) {
  const out = {}
  let running = 0
  ids.forEach((id, i) => {
    if (i === ids.length - 1) out[id] = round2(total - running)
    else {
      const v = round2(total * (weights[id] || 0))
      out[id] = v
      running = round2(running + v)
    }
  })
  return out
}

export function sharedItemsOf(data) {
  const charges = (data.charges || []).map((c) => ({ ...c, kind: "charge" }))
  const budgets = (data.budgets || []).filter((b) => !isReimbursement(b)).map((b) => ({
    ...b,
    kind: "pleasure",
    frequency: "monthly",
    payer: b.payer || JOINT,
  }))
  return [...charges, ...budgets]
}

export function computeSavings(data) {
  const entries = (data.savings || [])
    .filter((e) => e.active !== false)
    .map((e) => ({
      ...e,
      amount: num(e.amount),
      signed: e.kind === "withdrawal" ? -num(e.amount) : num(e.amount),
    }))
    .sort((a, b) => (a.month === b.month ? cmp(a.createdAt, b.createdAt) : cmp(a.month, b.month)))

  let running = 0
  const withRunning = entries.map((e) => {
    running = round2(running + e.signed)
    return { ...e, running }
  })

  const monthMap = new Map()
  for (const e of withRunning) {
    const bucket = monthMap.get(e.month) || { month: e.month, net: 0, deposited: 0, withdrawn: 0 }
    bucket.net = round2(bucket.net + e.signed)
    if (e.signed >= 0) bucket.deposited = round2(bucket.deposited + e.signed)
    else bucket.withdrawn = round2(bucket.withdrawn - e.signed)
    bucket.running = e.running
    monthMap.set(e.month, bucket)
  }

  const months = [...monthMap.values()]

  return {
    entries: [...withRunning].reverse(),
    months,
    total: round2(running),
    deposited: round2(withRunning.filter((e) => e.signed > 0).reduce((s, e) => s + e.signed, 0)),
    withdrawn: round2(-withRunning.filter((e) => e.signed < 0).reduce((s, e) => s + e.signed, 0)),
    monthCount: months.length,
    averagePerMonth: months.length ? round2(running / months.length) : 0,
  }
}

function cmp(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""))
}

export function compute(data, month = currentMonthKey()) {
  const people = data.people || []
  const ids = people.map((p) => p.id)
  const byId = Object.fromEntries(people.map((p) => [p.id, p]))
  const settings = data.settings || {}
  const nameOf = (id) => byId[id]?.name || "?"

  const personal = (data.personal || [])
    .filter((i) => i.active !== false)
    .map((i) => ({
      ...i,
      owner: ids.includes(i.owner) ? i.owner : ids[0],
      monthly: toMonthly(i.amount, i.frequency),
    }))

  const incomes = Object.fromEntries(people.map((p) => [p.id, incomeOf(p)]))
  const deductions = zero(ids)
  for (const item of personal) if (item.deduct) deductions[item.owner] += item.monthly
  const bases = Object.fromEntries(ids.map((id) => [id, Math.max(0, incomes[id] - deductions[id])]))
  const totalIncome = ids.reduce((s, id) => s + incomes[id], 0)
  const totalBase = ids.reduce((s, id) => s + bases[id], 0)
  const prorata = normalizeWeights(bases, ids)
  const equal = normalizeWeights(Object.fromEntries(ids.map((id) => [id, 1])), ids)

  const items = sharedItemsOf(data)
    .filter((i) => i.active !== false && (!i.month || i.month === month))
    .map((i) => {
      const monthly = toMonthly(i.amount, i.frequency)
      const mode = i.split && i.split !== "inherit" ? i.split : settings.defaultSplit || "prorata"
      let weights
      if (mode === "equal") weights = equal
      else if (mode === "custom") weights = normalizeWeights(i.customShares || {}, ids)
      else weights = prorata
      const payer = ids.includes(i.payer) ? i.payer : JOINT
      return { ...i, payer, monthly, mode, weights }
    })

  const due = zero(ids)
  const paidDirect = zero(ids)
  const shareOfJoint = zero(ids)
  const personalTotal = zero(ids)
  const owes = Object.fromEntries(ids.map((id) => [id, zero(ids)]))
  const owesLines = Object.fromEntries(ids.map((id) => [id, Object.fromEntries(ids.map((o) => [o, []]))]))

  let jointTotal = 0
  let chargesTotal = 0
  let pleasureTotal = 0
  let variableTotal = 0

  for (const item of items) {
    for (const id of ids) due[id] += item.monthly * (item.weights[id] || 0)

    if (item.payer === JOINT) {
      jointTotal += item.monthly
      for (const id of ids) shareOfJoint[id] += item.monthly * (item.weights[id] || 0)
    } else {
      paidDirect[item.payer] += item.monthly
      for (const id of ids) {
        if (id === item.payer) continue
        const share = item.monthly * (item.weights[id] || 0)
        if (share <= 0.0001) continue
        owes[id][item.payer] += share
        owesLines[id][item.payer].push({
          id: item.id,
          label: item.label,
          kind: item.kind,
          monthly: round2(item.monthly),
          share: round2(share),
          weight: item.weights[id] || 0,
        })
      }
    }

    if (item.kind === "pleasure") pleasureTotal += item.monthly
    else chargesTotal += item.monthly
    if (item.kind !== "pleasure" && item.variable) variableTotal += item.monthly
  }

  for (const item of personal) personalTotal[item.owner] += item.monthly

  const debts = (data.budgets || []).filter(
    (d) =>
      isReimbursement(d) &&
      d.active !== false &&
      d.month === month &&
      ids.includes(d.from) &&
      ids.includes(d.to) &&
      d.from !== d.to &&
      num(d.amount) > 0
  )
  for (const d of debts) {
    const amount = num(d.amount)
    owes[d.from][d.to] += amount
    owesLines[d.from][d.to].push({
      id: d.id,
      label: d.label,
      kind: "debt",
      monthly: round2(amount),
      share: round2(amount),
      weight: 1,
    })
  }

  const poolTotal = chargesTotal + pleasureTotal
  const jointContribution = distribute(round2(jointTotal), ids, shareOfJoint2weights(shareOfJoint, ids))

  const reimbursements = []
  for (const from of ids) {
    for (const to of ids) {
      if (from === to) continue
      const gross = round2(owes[from][to])
      if (gross <= 0.005) continue
      reimbursements.push({
        id: `r_${from}_${to}`,
        fromId: from,
        fromName: nameOf(from),
        toId: to,
        toName: nameOf(to),
        amount: gross,
        lines: owesLines[from][to],
      })
    }
  }

  const transfers = []
  for (const id of ids) {
    if (jointContribution[id] > 0.005) {
      transfers.push({
        id: `t_${id}_joint`,
        fromId: id,
        fromName: nameOf(id),
        toId: JOINT,
        toName: null,
        toJoint: true,
        kind: "joint",
        amount: jointContribution[id],
        lines: [],
      })
    }
  }

  const seen = new Set()
  for (const from of ids) {
    for (const to of ids) {
      if (from === to) continue
      const key = [from, to].sort().join("|")
      if (seen.has(key)) continue
      seen.add(key)
      const net = round2(owes[from][to] - owes[to][from])
      if (Math.abs(net) <= 0.005) continue
      const [payer, receiver] = net > 0 ? [from, to] : [to, from]
      transfers.push({
        id: `t_${payer}_${receiver}`,
        fromId: payer,
        fromName: nameOf(payer),
        toId: receiver,
        toName: nameOf(receiver),
        toJoint: false,
        kind: "reimbursement",
        amount: Math.abs(net),
        lines: owesLines[payer][receiver],
        counterLines: owesLines[receiver][payer],
        gross: round2(owes[payer][receiver]),
        counterGross: round2(owes[receiver][payer]),
      })
    }
  }

  const perPerson = people.map((p, index) => {
    const income = incomes[p.id]
    const out = transfers.filter((t) => t.fromId === p.id).reduce((s, t) => s + t.amount, 0)
    const inbound = transfers.filter((t) => t.toId === p.id).reduce((s, t) => s + t.amount, 0)
    const dueValue = round2(due[p.id])
    const perso = round2(personalTotal[p.id])
    return {
      ...p,
      index,
      color: p.color || PERSON_COLORS[index % PERSON_COLORS.length],
      income,
      deduction: round2(deductions[p.id]),
      prorataBase: round2(bases[p.id]),
      incomeShare: totalBase > 0 ? bases[p.id] / totalBase : prorata[p.id] || 0,
      due: dueValue,
      paidDirect: round2(paidDirect[p.id]),
      balance: round2(due[p.id] - paidDirect[p.id]),
      toJoint: jointContribution[p.id] || 0,
      transfersOut: round2(out),
      transfersIn: round2(inbound),
      owesToOthers: round2(ids.reduce((s, id) => s + owes[p.id][id], 0)),
      owedByOthers: round2(ids.reduce((s, id) => s + owes[id][p.id], 0)),
      personalTotal: perso,
      effortRate: income > 0 ? dueValue / income : 0,
      totalEffortRate: income > 0 ? (dueValue + perso) / income : 0,
      leftAfterShared: round2(income - dueValue),
      leftToLive: round2(income - dueValue - perso),
    }
  })

  return {
    people: perPerson,
    items,
    personal,
    debts,
    savings: computeSavings(data),
    totalIncome: round2(totalIncome),
    chargesTotal: round2(chargesTotal),
    pleasureTotal: round2(pleasureTotal),
    fixedTotal: round2(chargesTotal - variableTotal),
    variableTotal: round2(variableTotal),
    poolTotal: round2(poolTotal),
    jointTotal: round2(jointTotal),
    directTotal: round2(poolTotal - jointTotal),
    personalTotalAll: round2(ids.reduce((s, id) => s + personalTotal[id], 0)),
    reimbursements,
    transfers,
    leftToLiveTotal: round2(
      totalIncome - poolTotal - ids.reduce((s, id) => s + personalTotal[id], 0)
    ),
  }
}

function zero(ids) {
  return Object.fromEntries(ids.map((id) => [id, 0]))
}

function shareOfJoint2weights(shareOfJoint, ids) {
  const total = ids.reduce((s, id) => s + shareOfJoint[id], 0)
  if (total <= 0) return zero(ids)
  return Object.fromEntries(ids.map((id) => [id, shareOfJoint[id] / total]))
}

export function formatMoney(value, settings = {}) {
  const currency = settings.currency || "EUR"
  const locale = settings.locale || "fr-FR"
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num(value))
  } catch {
    return `${round2(num(value)).toFixed(2)} ${currency}`
  }
}

export function currencySymbol(currency) {
  const map = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF", CAD: "$" }
  return map[currency] || currency
}

export function formatPercent(value, digits = 1) {
  return `${(num(value) * 100).toFixed(digits).replace(/\.0+$/, "")} %`
}

export function monthLabel(key, locale = "fr-FR") {
  const [y, m] = String(key || "").split("-")
  if (!y || !m) return key || ""
  const d = new Date(Number(y), Number(m) - 1, 1)
  const s = d.toLocaleDateString(locale, { month: "long", year: "numeric" })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function paymentProgress(transfers, payments, month) {
  const ofMonth = (payments || []).filter((p) => p.month === month)
  const byTransfer = {}
  for (const t of transfers) {
    const list = ofMonth
      .filter((p) => p.transferId === t.id)
      .sort((a, b) => cmp(a.at, b.at))
    const paid = round2(list.reduce((s, p) => s + num(p.amount), 0))
    byTransfer[t.id] = {
      list,
      paid,
      remaining: round2(Math.max(0, t.amount - paid)),
      extra: round2(Math.max(0, paid - t.amount)),
      complete: paid >= t.amount - 0.005,
      lastAt: list.length ? list[list.length - 1].at : null,
    }
  }
  const known = new Set(transfers.map((t) => t.id))
  const due = round2(transfers.reduce((s, t) => s + t.amount, 0))
  const covered = round2(
    transfers.reduce((s, t) => s + Math.min(t.amount, byTransfer[t.id].paid), 0)
  )
  return {
    byTransfer,
    orphans: ofMonth.filter((p) => !known.has(p.transferId)),
    due,
    covered,
    paid: round2(ofMonth.reduce((s, p) => s + num(p.amount), 0)),
    count: ofMonth.length,
    complete: transfers.length > 0 && transfers.every((t) => byTransfer[t.id].complete),
  }
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number)
  return currentMonthKey(new Date(y, m - 1 + delta, 1))
}
