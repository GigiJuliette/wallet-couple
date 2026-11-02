import { HandCoins, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MoneyInput } from "@/components/common"

export function DebtsCard({ data, month, onAdd, onUpdate, onRemove }) {
  const s = data.settings
  const debts = data.debts.filter((d) => d.month === month)
  const canAdd = data.people.length >= 2
  const personSelect = (value, onChange) => (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {data.people.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="size-4 text-primary" />
              Remboursements ponctuels
            </CardTitle>
            <CardDescription>
              Une somme due à l'autre pour ce mois seulement, ajoutée au virement entre vous
              dans Vue du mois.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" disabled={!canAdd} onClick={() => onAdd({ month })}>
            <Plus />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      {debts.length ? (
        <CardContent className="flex flex-col gap-2.5">
          {debts.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_1fr_2fr_8rem_auto]"
            >
              {personSelect(d.from, (v) => onUpdate(d.id, { from: v }))}
              <span className="text-xs text-muted-foreground">doit à</span>
              {personSelect(d.to, (v) => onUpdate(d.id, { to: v }))}
              <Input
                value={d.label}
                onChange={(e) => onUpdate(d.id, { label: e.target.value })}
                placeholder="Pour quoi ?"
                className="col-span-3 sm:col-span-1"
              />
              <div className="col-span-2 sm:col-span-1">
                <MoneyInput
                  value={d.amount}
                  currency={s.currency}
                  onChange={(v) => onUpdate(d.id, { amount: v })}
                />
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                className="justify-self-end text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(d.id)}
                aria-label="Supprimer"
              >
                <Trash2 />
              </Button>
              {d.from === d.to ? (
                <p className="col-span-full text-[11px] text-destructive">
                  Choisis deux personnes différentes.
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  )
}
