import * as React from "react"
import { BarChart3, Crown, Percent, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CategoryIcon, EmptyState, StatCard } from "@/components/common"
import { categoryBreakdown, formatMoney, formatPercent, monthLabel } from "@/lib/calc"
import { cn } from "@/lib/utils"

export function StatsTab({ data, result, month }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const [view, setView] = React.useState("all")

  const views = [
    { id: "all", label: "Tout" },
    { id: "commun", label: "Commun" },
    ...result.people.map((p) => ({ id: p.id, label: p.name, color: p.color })),
  ]
  const current = views.find((v) => v.id === view) ? view : "all"
  const stats = categoryBreakdown(result, current)
  const top = stats.rows[0]
  const max = top?.total || 0
  const person = result.people.find((p) => p.id === current)
  const showSplit = current !== "commun" && stats.commun > 0.005 && stats.perso > 0.005

  const description =
    current === "all"
      ? "Tout le commun et toutes les charges perso du foyer."
      : current === "commun"
        ? "Les charges et plaisirs communs, montants complets."
        : `Sa part du commun plus ses charges perso : ce qui sort de la poche de ${person?.name}.`

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">
              Tableau de bord · {monthLabel(month, s.locale)}
            </h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
            {views.map((v) => (
              <Button
                key={v.id}
                size="sm"
                variant={current === v.id ? "secondary" : "ghost"}
                onClick={() => setView(v.id)}
              >
                {v.color ? (
                  <span className="size-2 rounded-full" style={{ background: v.color }} />
                ) : null}
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total du mois"
            value={money(stats.total)}
            hint={`${stats.rows.length} catégorie${stats.rows.length > 1 ? "s" : ""}`}
            icon={Wallet}
            tone="primary"
          />
          <StatCard
            label="Plus grosse catégorie"
            value={top ? top.category : "—"}
            hint={top ? `${money(top.total)} · ${formatPercent(top.share)} du total` : "rien ce mois-ci"}
            icon={Crown}
          />
          <StatCard
            label={person ? `Part du revenu de ${person.name}` : "Part des revenus du foyer"}
            value={stats.income > 0 ? formatPercent(stats.total / stats.income) : "—"}
            hint={stats.income > 0 ? `sur ${money(stats.income)}` : "revenu non renseigné"}
            icon={Percent}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Par catégorie</CardTitle>
            <CardDescription>Du plus gros au plus petit, par mois.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.rows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Rien à afficher"
                description="Le graphique se remplit dès que vous ajoutez des charges, des plaisirs ou des charges perso."
              />
            ) : (
              <div className="flex flex-col gap-1">
                {stats.rows.map((r) => (
                  <Tooltip key={r.category}>
                    <TooltipTrigger asChild>
                      <div className="grid cursor-default grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/60 sm:grid-cols-[11rem_1fr_7rem]">
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <CategoryIcon name={r.category} />
                          <span className="truncate font-medium">{r.category}</span>
                        </span>
                        <span className="col-span-2 row-start-2 h-3 sm:col-span-1 sm:row-start-auto">
                          <span
                            className="block h-full rounded-r-[4px] bg-primary"
                            style={{ width: `${max > 0 ? Math.max(1, (r.total / max) * 100) : 0}%` }}
                          />
                        </span>
                        <span className="text-right text-sm tabular-nums">
                          <span className="font-semibold">{money(r.total)}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {formatPercent(r.share, 0)}
                          </span>
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-medium">{r.category}</p>
                      {r.commun > 0.005 ? (
                        <p className="tabular-nums">
                          {current === "commun" || current === "all" ? "Commun" : "Sa part du commun"} :{" "}
                          {money(r.commun)}
                        </p>
                      ) : null}
                      {r.perso > 0.005 ? <p className="tabular-nums">Perso : {money(r.perso)}</p> : null}
                      <p className="text-muted-foreground">{formatPercent(r.share)} du total</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showSplit ? (
          <Card>
            <CardHeader>
              <CardTitle>Commun ou perso</CardTitle>
              <CardDescription>
                {person
                  ? `Part du commun et charges perso de ${person.name}.`
                  : "Ce qui est partagé, et ce que chacun paie de son côté."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-[4px]">
                <SplitSegment
                  value={stats.commun}
                  total={stats.total}
                  className="bg-primary"
                  label={person ? "Sa part du commun" : "Commun"}
                  money={money}
                />
                <SplitSegment
                  value={stats.perso}
                  total={stats.total}
                  className="bg-primary/40"
                  label="Perso"
                  money={money}
                />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <Legend className="bg-primary" label={person ? "Sa part du commun" : "Commun"} value={money(stats.commun)} share={stats.commun / stats.total} />
                <Legend className="bg-primary/40" label="Perso" value={money(stats.perso)} share={stats.perso / stats.total} />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </TooltipProvider>
  )
}

function SplitSegment({ value, total, className, label, money }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("h-full cursor-default", className)}
          style={{ width: `${(value / total) * 100}%` }}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        {label} : {money(value)} · {formatPercent(value / total)}
      </TooltipContent>
    </Tooltip>
  )
}

function Legend({ className, label, value, share }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-2.5 shrink-0 rounded-sm", className)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
      <span className="text-muted-foreground tabular-nums">{formatPercent(share, 0)}</span>
    </span>
  )
}
