import * as React from "react"
import { ClipboardCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CategoryIcon, EmptyState, StatCard } from "@/components/common"
import {
  PERSON_COLORS,
  currencySymbol,
  formatMoney,
  monthLabel,
  num,
  round2,
  toMonthly,
} from "@/lib/calc"
import { cn } from "@/lib/utils"

export function BilanTab({ data, month, onSetActual }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const actuals = data.actuals[month] || {}

  const toLine = (item) => {
    const planned = round2(toMonthly(item.amount, item.frequency))
    const real = item.id in actuals ? actuals[item.id] : null
    return { item, planned, real, diff: real === null ? null : round2(real - planned) }
  }

  const groups = [
    {
      id: "commun",
      title: "Commun",
      lines: data.charges.filter((c) => c.variable && c.active !== false).map(toLine),
    },
    ...data.people.map((p, index) => ({
      id: p.id,
      title: p.name,
      color: p.color || PERSON_COLORS[index % PERSON_COLORS.length],
      lines: data.personal
        .filter((i) => i.variable && i.active !== false && i.owner === p.id)
        .map(toLine),
    })),
  ].filter((g) => g.lines.length)

  const all = groups.flatMap((g) => g.lines)
  const filled = all.filter((l) => l.real !== null)
  const totals = summarize(all)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold">Bilan · {monthLabel(month, s.locale)}</h2>
        <p className="text-xs text-muted-foreground">
          Pour chaque charge variable, note ce que vous avez réellement payé ce mois-ci.
        </p>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aucune charge variable"
          description="Ajoutez des charges dans l'onglet Variables, ou passez une charge perso en variable : elles apparaîtront ici."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Prévu" value={money(totals.planned)} hint="toutes les variables" />
            <StatCard
              label="Réellement payé"
              value={money(totals.real)}
              hint={`${filled.length} ligne${filled.length > 1 ? "s" : ""} remplie${filled.length > 1 ? "s" : ""} sur ${all.length}`}
            />
            <StatCard
              label="Écart"
              value={filled.length ? signed(totals.diff, money) : "—"}
              hint={filled.length ? diffHint(totals.diff) : "rien de rempli"}
              tone={!filled.length ? "default" : totals.diff > 0.005 ? "default" : "success"}
            />
          </div>

          {groups.map((g) => {
            const sub = summarize(g.lines)
            return (
              <Card key={g.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      {g.color ? (
                        <span className="size-2.5 rounded-full" style={{ background: g.color }} />
                      ) : null}
                      {g.title}
                    </CardTitle>
                    <CardDescription className="tabular-nums">
                      prévu {money(sub.planned)}
                      {sub.count ? ` · réel ${money(sub.real)} · ${signed(sub.diff, money)}` : ""}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col divide-y divide-border">
                  {g.lines.map((l) => (
                    <div
                      key={l.item.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 py-2.5 sm:grid-cols-[1fr_7rem_8rem_8rem]"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <CategoryIcon name={l.item.category} />
                        <span className="truncate font-medium">{l.item.label || "Sans nom"}</span>
                      </span>
                      <span className="text-right text-sm tabular-nums text-muted-foreground">
                        <span className="sm:hidden">prévu </span>
                        {money(l.planned)}
                      </span>
                      <ActualInput
                        value={l.real}
                        currency={s.currency}
                        onChange={(v) => onSetActual(month, l.item.id, v)}
                      />
                      <span
                        className={cn(
                          "text-right text-xs tabular-nums",
                          l.diff === null
                            ? "text-muted-foreground"
                            : l.diff > 0.005
                              ? "font-medium text-destructive"
                              : "font-medium text-success"
                        )}
                      >
                        {l.diff === null ? "à remplir" : `${signed(l.diff, money)} ${diffHint(l.diff)}`}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}

function summarize(lines) {
  const filled = lines.filter((l) => l.real !== null)
  return {
    planned: round2(lines.reduce((s, l) => s + l.planned, 0)),
    real: round2(filled.reduce((s, l) => s + l.real, 0)),
    diff: round2(filled.reduce((s, l) => s + l.diff, 0)),
    count: filled.length,
  }
}

function signed(value, money) {
  if (Math.abs(value) <= 0.005) return money(0)
  return `${value > 0 ? "+" : "−"}${money(Math.abs(value))}`
}

function diffHint(value) {
  if (value > 0.005) return "dépassé"
  if (value < -0.005) return "économisé"
  return "pile"
}

function ActualInput({ value, currency, onChange }) {
  const [draft, setDraft] = React.useState(null)
  const text = draft ?? (value === null ? "" : String(value))
  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        value={text}
        placeholder="réel"
        aria-label="Réellement payé"
        onFocus={() => setDraft(value === null ? "" : String(value))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,-]/g, "")
          setDraft(raw)
          onChange(raw === "" ? null : num(raw))
        }}
        className="pr-8 text-right tabular-nums"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        {currencySymbol(currency)}
      </span>
    </div>
  )
}
