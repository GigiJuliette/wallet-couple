import * as React from "react"
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState, Field, MoneyInput, StatCard } from "@/components/common"
import { cn } from "@/lib/utils"
import { currentMonthKey, formatMoney, monthLabel } from "@/lib/calc"

function monthOptions(around, span = 18) {
  const [y, m] = around.split("-").map(Number)
  const out = []
  for (let i = span; i >= -span; i--) {
    const d = new Date(y, m - 1 - i, 1)
    out.push(currentMonthKey(d))
  }
  return out
}

export function SavingsTab({ data, result, month, onAdd, onUpdate, onRemove }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const savings = result.savings
  const options = React.useMemo(() => monthOptions(month), [month])

  const thisMonth = savings.months.find((x) => x.month === month)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Cagnotte</h2>
          <p className="text-xs text-muted-foreground">
            Notez ce que vous mettez de côté chaque mois. Le total monte tout seul.
          </p>
        </div>
        <Button size="sm" onClick={() => onAdd({ month })}>
          <Plus />
          Ajouter un versement
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de la cagnotte"
          value={money(savings.total)}
          hint={
            savings.monthCount
              ? `${savings.monthCount} mois alimenté${savings.monthCount > 1 ? "s" : ""}`
              : "aucun versement"
          }
          icon={PiggyBank}
          tone="success"
        />
        <StatCard
          label={`Mis de côté en ${monthLabel(month, s.locale).toLowerCase()}`}
          value={money(thisMonth?.net || 0)}
          hint={thisMonth ? "somme des lignes du mois" : "rien pour ce mois-ci"}
        />
        <StatCard
          label="Total versé"
          value={money(savings.deposited)}
          hint={savings.withdrawn > 0 ? `dont ${money(savings.withdrawn)} ressortis` : "aucun retrait"}
        />
        <StatCard
          label="Moyenne par mois"
          value={money(savings.averagePerMonth)}
          hint="sur les mois alimentés"
        />
      </div>

      {savings.months.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Comment la cagnotte a grossi</CardTitle>
            <CardDescription>Le total cumulé après chaque mois.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              {savings.months.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                    {monthLabel(m.month, s.locale)}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{
                        width: `${savings.total > 0 ? Math.max(1, (m.running / savings.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                    {money(m.running)}
                  </span>
                  <span
                    className={cn(
                      "w-20 shrink-0 text-right text-[11px] tabular-nums",
                      m.net >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {m.net >= 0 ? "+" : ""}
                    {money(m.net)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {savings.entries.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="La cagnotte est vide"
          description="Ajoutez un premier versement pour le mois en cours, puis un chaque mois."
          action={
            <Button size="sm" onClick={() => onAdd({ month })}>
              <Plus />
              Ajouter un versement
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {savings.entries.map((entry) => {
            const source = data.savings.find((x) => x.id === entry.id)
            if (!source) return null
            const withdrawal = source.kind === "withdrawal"
            return (
              <Card key={entry.id}>
                <CardContent className="flex flex-col gap-3 pt-4">
                  <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <Select
                        value={source.month}
                        onValueChange={(v) => onUpdate(source.id, { month: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => (
                            <SelectItem key={o} value={o}>
                              {monthLabel(o, s.locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3">
                      <Select
                        value={source.kind}
                        onValueChange={(v) => onUpdate(source.id, { kind: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">On met de côté</SelectItem>
                          <SelectItem value="withdrawal">On sort de la cagnotte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <MoneyInput
                        value={source.amount}
                        currency={s.currency}
                        onChange={(v) => onUpdate(source.id, { amount: v })}
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-4">
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">cagnotte après</p>
                        <p className="truncate text-sm font-semibold tabular-nums">
                          {money(entry.running)}
                        </p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(source.id)}
                        aria-label="Supprimer ce versement"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={withdrawal ? "destructive" : "success"}>
                      {withdrawal ? <ArrowUpRight /> : <ArrowDownLeft />}
                      {withdrawal ? "retrait" : "versement"} {money(source.amount)}
                    </Badge>
                    <Badge variant="outline">{monthLabel(source.month, s.locale)}</Badge>
                  </div>

                  <Separator />

                  <Field label="Note">
                    <Input
                      value={source.note || ""}
                      onChange={(e) => onUpdate(source.id, { note: e.target.value })}
                      placeholder="Vacances, travaux, épargne de précaution..."
                    />
                  </Field>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
