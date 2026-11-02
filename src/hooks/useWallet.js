import { useCallback, useEffect, useMemo, useState } from "react"
import { clearData, defaultData, loadData, normalizeData, saveData, uid } from "@/lib/storage"
import { compute, currentMonthKey, paymentProgress } from "@/lib/calc"

export function useWallet(month) {
  const [data, setData] = useState(() => loadData())
  const [lastAdded, setLastAdded] = useState(null)

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
          d.debts = d.debts.filter((x) => x.from !== id && x.to !== id)
          d.payments = d.payments.filter((x) => !x.transferId.includes(id))
          return d
        }),

      addCharge: (preset = {}) => {
        const id = uid("c")
        update((d) => {
          d.charges.unshift({
            id,
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
        })
        setLastAdded(id)
      },

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

      duplicateCharge: (id) => {
        const copyId = uid("c")
        update((d) => {
          const i = d.charges.findIndex((c) => c.id === id)
          if (i >= 0) {
            const copy = structuredClone(d.charges[i])
            copy.id = copyId
            copy.label = `${copy.label} (copie)`
            d.charges.splice(i + 1, 0, copy)
          }
          return d
        })
        setLastAdded(copyId)
      },

      addBudget: (preset = {}) => {
        const id = uid("b")
        update((d) => {
          d.budgets.unshift({
            id,
            label: "Nouvelle dépense",
            month: currentMonthKey(),
            category: "Autre",
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
        })
        setLastAdded(id)
      },

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

      addPersonal: (preset = {}) => {
        const id = uid("x")
        update((d) => {
          d.personal.unshift({
            id,
            label: "Nouvelle charge perso",
            amount: 0,
            frequency: "monthly",
            owner: preset.owner || d.people[0]?.id,
            category: "Autre",
            note: "",
            deduct: false,
            active: true,
            ...preset,
          })
          return d
        })
        setLastAdded(id)
      },

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

      duplicatePersonal: (id) => {
        const copyId = uid("x")
        update((d) => {
          const i = d.personal.findIndex((x) => x.id === id)
          if (i >= 0) {
            const copy = structuredClone(d.personal[i])
            copy.id = copyId
            copy.label = `${copy.label} (copie)`
            d.personal.splice(i + 1, 0, copy)
          }
          return d
        })
        setLastAdded(copyId)
      },

      addDebt: (preset = {}) =>
        update((d) => {
          const [first, second] = d.people
          d.debts.push({
            id: uid("d"),
            month: currentMonthKey(),
            from: first?.id,
            to: second?.id,
            amount: 0,
            label: "",
            ...preset,
          })
          return d
        }),

      updateDebt: (id, patch) =>
        update((d) => {
          const x = d.debts.find((e) => e.id === id)
          if (x) Object.assign(x, patch)
          return d
        }),

      removeDebt: (id) =>
        update((d) => {
          d.debts = d.debts.filter((e) => e.id !== id)
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

      addPayment: (month, transferId, amount) =>
        update((d) => {
          d.payments.push({
            id: uid("v"),
            month,
            transferId,
            amount,
            at: new Date().toISOString(),
          })
          return d
        }),

      removePayment: (id) =>
        update((d) => {
          d.payments = d.payments.filter((p) => p.id !== id)
          return d
        }),

      clearMonthPayments: (month) =>
        update((d) => {
          d.payments = d.payments.filter((p) => p.month !== month)
          return d
        }),

      archiveMonth: (month) =>
        update((d) => {
          const key = month || currentMonthKey()
          const result = compute(d, key)
          const progress = paymentProgress(result.transfers, d.payments, key)
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
              transfers: result.transfers.map((t) => {
                const p = progress.byTransfer[t.id]
                return { ...t, paid: p.paid, done: p.complete, doneAt: p.complete ? p.lastAt : null }
              }),
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
              debts: d.debts.filter((x) => x.month === key),
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
            d.budgets = structuredClone(entry.snapshot.budgets || []).map((b) =>
              b.month ? b : { ...b, month: entry.month }
            )
            d.personal = structuredClone(entry.snapshot.personal || [])
            if (entry.snapshot.debts) {
              const restored = structuredClone(entry.snapshot.debts)
              d.debts = [...d.debts.filter((x) => x.month !== entry.month), ...restored]
            }
          }
          return d
        }),

      clearLastAdded: () => setLastAdded(null),

      replaceAll: (next) => setData(normalizeData(next)),

      reset: () => {
        clearData()
        setData(defaultData())
      },
    }),
    [update]
  )

  const result = useMemo(() => compute(data, month), [data, month])

  return { data, result, lastAdded, ...api }
}
