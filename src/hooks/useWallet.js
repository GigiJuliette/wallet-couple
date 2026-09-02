import { useCallback, useEffect, useMemo, useState } from "react"
import { clearData, defaultData, loadData, normalizeData, saveData, uid } from "@/lib/storage"
import { compute, currentMonthKey } from "@/lib/calc"

export function useWallet() {
  const [data, setData] = useState(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", data.settings.theme === "dark")
  }, [data.settings.theme])

  const update = useCallback((fn) => {
    setData((prev) => fn(structuredClone(prev)))
  }, [])

  const api = useMemo(
    () => ({
      setSetting: (key, value) =>
        update((d) => {
          d.settings[key] = value
          return d
        }),

      addPerson: () =>
        update((d) => {
          d.people.push({
            id: uid("p"),
            name: `Personne ${d.people.length + 1}`,
            netIncome: 0,
            otherIncome: 0,
            color: null,
          })
          return d
        }),

      updatePerson: (id, patch) =>
        update((d) => {
          const p = d.people.find((x) => x.id === id)
          if (p) Object.assign(p, patch)
          return d
        }),

      removePerson: (id) =>
        update((d) => {
          d.people = d.people.filter((p) => p.id !== id)
          const fix = (list) =>
            list.forEach((item) => {
              if (item.payer === id) item.payer = "joint"
              if (item.customShares) delete item.customShares[id]
            })
          fix(d.charges)
          fix(d.budgets)
          d.personal = d.personal.filter((i) => i.owner !== id)
          return d
        }),

      addCharge: (preset = {}) =>
        update((d) => {
          d.charges.unshift({
            id: uid("c"),
            label: "Nouvelle charge",
            amount: 0,
            frequency: "monthly",
            payer: "joint",
            split: "inherit",
            customShares: {},
            category: "Autre",
            note: "",
            active: true,
            ...preset,
          })
          return d
        }),

      updateCharge: (id, patch) =>
        update((d) => {
          const c = d.charges.find((x) => x.id === id)
          if (c) Object.assign(c, patch)
          return d
        }),

      removeCharge: (id) =>
        update((d) => {
          d.charges = d.charges.filter((c) => c.id !== id)
          return d
        }),

      duplicateCharge: (id) =>
        update((d) => {
          const i = d.charges.findIndex((c) => c.id === id)
          if (i >= 0) {
            const copy = structuredClone(d.charges[i])
            copy.id = uid("c")
            copy.label = `${copy.label} (copie)`
            d.charges.splice(i + 1, 0, copy)
          }
          return d
        }),

      addBudget: (preset = {}) =>
        update((d) => {
          d.budgets.unshift({
            id: uid("b"),
            label: "Nouvelle enveloppe",
            amount: 0,
            frequency: "monthly",
            payer: "joint",
            split: "inherit",
            customShares: {},
            note: "",
            active: true,
            ...preset,
          })
          return d
        }),

      updateBudget: (id, patch) =>
        update((d) => {
          const b = d.budgets.find((x) => x.id === id)
          if (b) Object.assign(b, patch)
          return d
        }),

      removeBudget: (id) =>
        update((d) => {
          d.budgets = d.budgets.filter((b) => b.id !== id)
          return d
        }),

      addPersonal: (preset = {}) =>
        update((d) => {
          d.personal.unshift({
            id: uid("x"),
            label: "Nouvelle charge perso",
            amount: 0,
            frequency: "monthly",
            owner: preset.owner || d.people[0]?.id,
            category: "Autre",
            note: "",
            active: true,
            ...preset,
          })
          return d
        }),

      updatePersonal: (id, patch) =>
        update((d) => {
          const i = d.personal.find((x) => x.id === id)
          if (i) Object.assign(i, patch)
          return d
        }),

      removePersonal: (id) =>
        update((d) => {
          d.personal = d.personal.filter((i) => i.id !== id)
          return d
        }),

      duplicatePersonal: (id) =>
        update((d) => {
          const i = d.personal.findIndex((x) => x.id === id)
          if (i >= 0) {
            const copy = structuredClone(d.personal[i])
            copy.id = uid("x")
            copy.label = `${copy.label} (copie)`
            d.personal.splice(i + 1, 0, copy)
          }
          return d
        }),

      addSaving: (preset = {}) =>
        update((d) => {
          d.savings.unshift({
            id: uid("s"),
            month: preset.month || currentMonthKey(),
            amount: 0,
            kind: "deposit",
            note: "",
            createdAt: new Date().toISOString(),
            active: true,
            ...preset,
          })
          return d
        }),

      updateSaving: (id, patch) =>
        update((d) => {
          const e = d.savings.find((x) => x.id === id)
          if (e) Object.assign(e, patch)
          return d
        }),

      removeSaving: (id) =>
        update((d) => {
          d.savings = d.savings.filter((e) => e.id !== id)
          return d
        }),

      toggleTransfer: (month, transferId, amount) =>
        update((d) => {
          const bucket = d.done[month] || {}
          if (bucket[transferId]) delete bucket[transferId]
          else bucket[transferId] = { at: new Date().toISOString(), amount }
          if (Object.keys(bucket).length) d.done[month] = bucket
          else delete d.done[month]
          return d
        }),

      clearMonthTransfers: (month) =>
        update((d) => {
          delete d.done[month]
          return d
        }),

      archiveMonth: (month) =>
        update((d) => {
          const key = month || currentMonthKey()
          const result = compute(d)
          const entry = {
            id: uid("h"),
            month: key,
            savedAt: new Date().toISOString(),
            summary: {
              totalIncome: result.totalIncome,
              chargesTotal: result.chargesTotal,
              pleasureTotal: result.pleasureTotal,
              poolTotal: result.poolTotal,
              jointTotal: result.jointTotal,
              personalTotalAll: result.personalTotalAll,
              savingsTotal: result.savings.total,
              transfers: result.transfers.map((t) => ({
                ...t,
                done: Boolean(d.done[key]?.[t.id]),
                doneAt: d.done[key]?.[t.id]?.at || null,
              })),
              people: result.people.map((p) => ({
                id: p.id,
                name: p.name,
                income: p.income,
                incomeShare: p.incomeShare,
                due: p.due,
                paidDirect: p.paidDirect,
                toJoint: p.toJoint,
                personalTotal: p.personalTotal,
                leftToLive: p.leftToLive,
              })),
            },
            snapshot: {
              people: d.people,
              charges: d.charges,
              budgets: d.budgets,
              personal: d.personal,
              settings: d.settings,
            },
          }
          d.history = [entry, ...d.history.filter((h) => h.month !== key)].slice(0, 60)
          return d
        }),

      removeHistory: (id) =>
        update((d) => {
          d.history = d.history.filter((h) => h.id !== id)
          return d
        }),

      restoreHistory: (id) =>
        update((d) => {
          const entry = d.history.find((h) => h.id === id)
          if (entry?.snapshot) {
            d.people = structuredClone(entry.snapshot.people || d.people)
            d.charges = structuredClone(entry.snapshot.charges || [])
            d.budgets = structuredClone(entry.snapshot.budgets || [])
            d.personal = structuredClone(entry.snapshot.personal || [])
          }
          return d
        }),

      replaceAll: (next) => setData(normalizeData(next)),

      reset: () => {
        clearData()
        setData(defaultData())
      },
    }),
    [update]
  )

  const result = useMemo(() => compute(data), [data])

  return { data, result, ...api }
}
