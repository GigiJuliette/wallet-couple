import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemRow } from "@/components/ItemRow"
import {
  REIMBURSEMENT,
  currentMonthKey,
  formatMoney,
  isReimbursement,
  monthLabel,
  num,
} from "@/lib/calc"

const PRESETS = [
  { label: "Resto", category: "Restos" },
  { label: "Week-end", category: "Voyages" },
  { label: "Cadeau", category: "Cadeaux" },
  { label: "Concert", category: "Sorties" },
  { label: "Cinéma", category: "Culture" },
  { label: "Déco maison", category: "Logement" },
  { label: "Remboursement", category: REIMBURSEMENT },
]

export function PleasureTab({ data, openId, onAdd, onUpdate, onRemove }) {
  const s = data.settings
  const now = currentMonthKey()
  const months = [...new Set([now, ...data.budgets.map((b) => b.month)])].sort().reverse()
  const [first, second] = data.people
  const presetOf = (p, month) =>
    p.category === REIMBURSEMENT
      ? { ...p, month, from: first?.id, to: second?.id }
      : { ...p, month }

  return (
    <div className="flex flex-col gap-10">
      {months.map((month) => {
        const items = data.budgets.filter((b) => b.month === month)
        const total = items
          .filter((b) => b.active !== false && !isReimbursement(b))
          .reduce((sum, b) => sum + num(b.amount), 0)
        return (
          <section key={month} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                Ponctuel · {monthLabel(month, s.locale)}
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {formatMoney(total, s)}
                </span>
              </h2>
              <Button size="sm" onClick={() => onAdd({ month })}>
                <Plus />
                Ajouter
              </Button>
            </div>
            {items.length ? (
              <div className="flex flex-col gap-2.5">
                {items.map((budget) => (
                  <ItemRow
                    key={budget.id}
                    item={budget}
                    defaultOpen={budget.id === openId}
                    people={data.people}
                    settings={s}
                    onUpdate={(patch) => onUpdate(budget.id, patch)}
                    onRemove={() => onRemove(budget.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">Rien de ponctuel ce mois-ci.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      size="sm"
                      variant="outline"
                      onClick={() => onAdd(presetOf(p, month))}
                    >
                      <Sparkles />
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
