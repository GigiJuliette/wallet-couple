import * as React from "react"
import { Plus, Receipt, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/common"
import { ItemRow } from "@/components/ItemRow"
import { JOINT, formatMoney, toMonthly } from "@/lib/calc"

const PRESETS = [
  { label: "Loyer", category: "Logement" },
  { label: "Électricité", category: "Énergie" },
  { label: "Internet", category: "Télécom" },
  { label: "Courses", category: "Courses" },
  { label: "Assurance habitation", category: "Assurances" },
  { label: "Eau", category: "Énergie" },
]

export function ChargesTab({ data, result, onAdd, onUpdate, onRemove, onDuplicate }) {
  const s = data.settings
  const [query, setQuery] = React.useState("")
  const [payerFilter, setPayerFilter] = React.useState("all")

  const visible = data.charges.filter((c) => {
    const okQuery =
      !query ||
      `${c.label} ${c.category} ${c.note}`.toLowerCase().includes(query.toLowerCase())
    const okPayer = payerFilter === "all" || c.payer === payerFilter
    return okQuery && okPayer
  })

  const visibleMonthly = visible
    .filter((c) => c.active !== false)
    .reduce((sum, c) => sum + toMonthly(c.amount, c.frequency), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Charges communes</h2>
          <p className="text-xs text-muted-foreground">
            Tout ce que vous voulez partager, peu importe le compte qui paie.
          </p>
        </div>
        <Button size="sm" onClick={() => onAdd()}>
          <Plus />
          Ajouter une charge
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher une charge"
              className="pl-8"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={payerFilter} onValueChange={setPayerFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                <SelectItem value={JOINT}>{s.jointAccountName || "Compte joint"}</SelectItem>
                {data.people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Total affiché par mois</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(visibleMonthly, s)}
            </p>
          </div>
        </CardContent>
      </Card>

      {data.charges.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune charge pour l'instant"
          description="Commencez par une ligne rapide, vous ajusterez les montants après."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="outline"
                  onClick={() => onAdd({ label: p.label, category: p.category })}
                >
                  <Sparkles />
                  {p.label}
                </Button>
              ))}
            </div>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="Rien ne correspond à cette recherche" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((charge) => (
            <ItemRow
              key={charge.id}
              item={charge}
              people={data.people}
              settings={s}
              computed={result.items.find((i) => i.id === charge.id)}
              onUpdate={(patch) => onUpdate(charge.id, patch)}
              onRemove={() => onRemove(charge.id)}
              onDuplicate={() => onDuplicate(charge.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
