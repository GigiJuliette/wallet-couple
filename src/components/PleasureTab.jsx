import { HeartHandshake, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, StatCard } from "@/components/common"
import { ItemRow } from "@/components/ItemRow"
import { DebtsCard } from "@/components/DebtsCard"
import { formatMoney, formatPercent, monthLabel } from "@/lib/calc"

const PRESETS = [
  { label: "Resto", category: "Restos" },
  { label: "Week-end", category: "Voyages" },
  { label: "Cadeau", category: "Cadeaux" },
  { label: "Concert", category: "Sorties" },
  { label: "Cinéma", category: "Culture" },
  { label: "Déco maison", category: "Logement" },
]

export function PleasureTab({
  data,
  result,
  month,
  openId,
  onAdd,
  onUpdate,
  onRemove,
  onAddDebt,
  onUpdateDebt,
  onRemoveDebt,
}) {
  const s = data.settings
  const jointName = s.jointAccountName || "Compte joint"
  const items = data.budgets.filter((b) => b.month === month)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Ponctuel · {monthLabel(month, s.locale)}
          </h2>
          <p className="text-xs text-muted-foreground">
            Ce qui ne compte que pour ce mois : les plaisirs communs et les remboursements entre
            vous. Ce qui revient chaque mois va dans les charges.
          </p>
        </div>
        <Button size="sm" onClick={() => onAdd({ month })}>
          <Plus />
          Ajouter un plaisir
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total des plaisirs"
          value={formatMoney(result.pleasureTotal, s)}
          hint="ce mois-ci"
          icon={HeartHandshake}
          tone="primary"
        />
        <StatCard
          label="Part dans le commun"
          value={
            result.poolTotal > 0
              ? formatPercent(result.pleasureTotal / result.poolTotal)
              : "0 %"
          }
          hint="charges + plaisirs"
        />
        <StatCard
          label="Part des revenus"
          value={
            result.totalIncome > 0
              ? formatPercent(result.pleasureTotal / result.totalIncome)
              : "0 %"
          }
          hint="revenus du foyer"
        />
      </div>

      <h3 className="text-xs font-semibold">Plaisirs communs</h3>
      {items.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="Pas encore de plaisir ce mois-ci"
          description="Un resto, un week-end, un cadeau commun : ça compte seulement pour ce mois."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="outline"
                  onClick={() => onAdd({ label: p.label, category: p.category, month })}
                >
                  <Sparkles />
                  {p.label}
                </Button>
              ))}
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((budget) => (
            <ItemRow
              key={budget.id}
              item={budget}
              defaultOpen={budget.id === openId}
              people={data.people}
              settings={s}
              computed={result.items.find((i) => i.id === budget.id)}
              onUpdate={(patch) => onUpdate(budget.id, patch)}
              onRemove={() => onRemove(budget.id)}
            />
          ))}
        </div>
      )}

      <DebtsCard
        data={data}
        month={month}
        onAdd={onAddDebt}
        onUpdate={onUpdateDebt}
        onRemove={onRemoveDebt}
      />

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche</CardTitle>
          <CardDescription>Un plaisir se partage comme une charge, mais pour un seul mois.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          <p>plaisir créé en novembre → compté en novembre seulement</p>
          <p>payé par le {jointName.toLowerCase()} → ajouté au virement vers le {jointName.toLowerCase()}</p>
          <p>avancé par l'un de vous → l'autre lui rembourse sa part</p>
          <p>remboursement ponctuel → ajouté au virement entre vous, ce mois seulement</p>
        </CardContent>
      </Card>
    </div>
  )
}
