import { HeartHandshake, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, StatCard } from "@/components/common"
import { ItemRow } from "@/components/ItemRow"
import { formatMoney, formatPercent } from "@/lib/calc"

const PRESETS = [
  "Restos & sorties",
  "Vacances",
  "Cadeaux",
  "Week-ends",
  "Culture & cinéma",
  "Déco maison",
]

export function PleasureTab({ data, result, onAdd, onUpdate, onRemove }) {
  const s = data.settings
  const jointName = s.jointAccountName || "Compte joint"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Budget plaisirs communs</h2>
          <p className="text-xs text-muted-foreground">
            Des enveloppes que vous alimentez chaque mois, partagées comme les charges.
          </p>
        </div>
        <Button size="sm" onClick={() => onAdd()}>
          <Plus />
          Ajouter une enveloppe
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total des enveloppes"
          value={formatMoney(result.pleasureTotal, s)}
          hint="par mois"
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

      {data.budgets.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="Pas encore d'enveloppe plaisir"
          description="Choisissez une enveloppe de départ, l'argent sera envoyé sur le compte joint comme le reste."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((label) => (
                <Button key={label} size="sm" variant="outline" onClick={() => onAdd({ label })}>
                  <Sparkles />
                  {label}
                </Button>
              ))}
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.budgets.map((budget) => (
            <ItemRow
              key={budget.id}
              item={budget}
              people={data.people}
              settings={s}
              showCategory={false}
              computed={result.items.find((i) => i.id === budget.id)}
              onUpdate={(patch) => onUpdate(budget.id, patch)}
              onRemove={() => onRemove(budget.id)}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche</CardTitle>
          <CardDescription>Une enveloppe se comporte comme une charge commune.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          <p>enveloppe du mois → ajoutée au total commun</p>
          <p>total commun → partagé selon la règle de la ligne</p>
          <p>part de chacun → virement vers le {jointName.toLowerCase()}</p>
        </CardContent>
      </Card>
    </div>
  )
}
