import * as React from "react"
import { BarChart3, Table2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmptyState } from "@/components/common"
import { formatMoney, formatPercent } from "@/lib/calc"

const SERIES = [
  { key: "commun", label: "Commun", color: "var(--viz-commun)" },
  { key: "perso", label: "Perso", color: "var(--viz-perso)" },
]

export function ExpensesChart({ categories, settings }) {
  const [view, setView] = React.useState("chart")
  const money = (v) => formatMoney(v, settings)

  const grandTotal = categories.reduce((s, c) => s + c.total, 0)
  const max = categories.reduce((m, c) => Math.max(m, c.total), 0)
  const activeSeries = SERIES.filter((s) => categories.some((c) => c[s.key] > 0.005))

  return (
    <Card className="viz">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Où part l'argent chaque mois</CardTitle>
            <CardDescription>
              {money(grandTotal)} par mois, par type de dépense, du plus gros au plus petit.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
            <Button
              size="sm"
              variant={view === "chart" ? "secondary" : "ghost"}
              onClick={() => setView("chart")}
            >
              <BarChart3 />
              Graphique
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "secondary" : "ghost"}
              onClick={() => setView("table")}
            >
              <Table2 />
              Tableau
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Rien à afficher"
            description="Le graphique se remplit dès que vous ajoutez des charges, des enveloppes ou des lignes perso."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {activeSeries.length > 1 ? (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {activeSeries.map((s) => (
                  <span key={s.key} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ background: s.color }}
                    />
                    <span className="text-muted-foreground">{s.label}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {view === "chart" ? (
              <TooltipProvider delayDuration={80}>
                <div className="flex flex-col gap-2.5">
                  {categories.map((row) => (
                    <Row
                      key={row.category}
                      row={row}
                      max={max}
                      grandTotal={grandTotal}
                      settings={settings}
                    />
                  ))}
                </div>
              </TooltipProvider>
            ) : (
              <ExpensesTable
                categories={categories}
                grandTotal={grandTotal}
                settings={settings}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ row, max, grandTotal, settings }) {
  const money = (v) => formatMoney(v, settings)
  const widthPct = max > 0 ? (row.total / max) * 100 : 0
  const segments = SERIES.filter((s) => row[s.key] > 0.005)

  return (
    <div className="grid grid-cols-[minmax(6.5rem,9rem)_1fr_auto] items-center gap-3">
      <span className="truncate text-xs text-muted-foreground" title={row.category}>
        {row.category}
      </span>

      <div className="min-w-0">
        <div
          className="flex h-4 gap-[2px]"
          style={{ width: `${Math.max(widthPct, 1.5)}%` }}
        >
          {segments.map((s, i) => (
            <Tooltip key={s.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${row.category}, ${s.label} : ${money(row[s.key])}`}
                  className="h-full min-w-[3px] cursor-default outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  style={{
                    background: s.color,
                    flexGrow: row[s.key],
                    flexBasis: 0,
                    borderRadius:
                      i === segments.length - 1 ? "0 4px 4px 0" : "0",
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{row.category}</p>
                <p className="text-muted-foreground">
                  {s.label} · {money(row[s.key])} par mois
                </p>
                {segments.length > 1 ? (
                  <p className="text-muted-foreground">
                    total de la catégorie : {money(row.total)}
                  </p>
                ) : null}
                <p className="text-muted-foreground">
                  {formatPercent(grandTotal > 0 ? row.total / grandTotal : 0)} de vos dépenses
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <span className="text-xs font-semibold tabular-nums">{money(row.total)}</span>
    </div>
  )
}

function ExpensesTable({ categories, grandTotal, settings }) {
  const money = (v) => formatMoney(v, settings)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Type de dépense</th>
            <th className="py-2 pr-3 text-right font-medium">Commun</th>
            <th className="py-2 pr-3 text-right font-medium">Perso</th>
            <th className="py-2 pr-3 text-right font-medium">Total</th>
            <th className="py-2 text-right font-medium">Part</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((row) => (
            <tr key={row.category} className="border-b border-border/60">
              <td className="py-2 pr-3">{row.category}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {row.commun > 0.005 ? money(row.commun) : "—"}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {row.perso > 0.005 ? money(row.perso) : "—"}
              </td>
              <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                {money(row.total)}
              </td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {formatPercent(grandTotal > 0 ? row.total / grandTotal : 0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-2 pr-3">Total</td>
            <td className="py-2 pr-3 text-right tabular-nums">
              {money(categories.reduce((s, c) => s + c.commun, 0))}
            </td>
            <td className="py-2 pr-3 text-right tabular-nums">
              {money(categories.reduce((s, c) => s + c.perso, 0))}
            </td>
            <td className="py-2 pr-3 text-right tabular-nums">{money(grandTotal)}</td>
            <td className="py-2 text-right tabular-nums">100 %</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
