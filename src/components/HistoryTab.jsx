import { ArrowRight, History, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CategoryIcon, EmptyState } from "@/components/common"
import { bilanLines, signed, summarize } from "@/lib/bilan"
import { formatMoney, formatPercent, isReimbursement, monthLabel, num, toMonthly } from "@/lib/calc"
import { cn } from "@/lib/utils"

export function HistoryTab({ data, onRemove, onRestore }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold">Historique des mois</h2>

      {data.history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Aucun mois archivé"
          description="Archivez un mois depuis Vue du mois."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.history.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{monthLabel(entry.month, s.locale)}</CardTitle>
                    <CardDescription>
                      archivé le {new Date(entry.savedAt).toLocaleDateString(s.locale)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRestore(entry.id)}
                      title="Remettre cette configuration comme configuration actuelle"
                    >
                      <RotateCcw />
                      Restaurer
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemove(entry.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">revenus {money(entry.summary?.totalIncome)}</Badge>
                  <Badge variant="outline">charges {money(entry.summary?.chargesTotal)}</Badge>
                  <Badge variant="outline">ponctuel {money(entry.summary?.pleasureTotal)}</Badge>
                  <Badge variant="soft">commun {money(entry.summary?.poolTotal)}</Badge>
                  {entry.summary?.personalTotalAll ? (
                    <Badge variant="outline">perso {money(entry.summary.personalTotalAll)}</Badge>
                  ) : null}
                </div>

                {entry.summary?.people?.length ? (
                  <>
                    <Separator />
                    <div className="grid gap-2 sm:grid-cols-2">
                      {entry.summary.people.map((p) => (
                        <div key={p.id} className="text-xs">
                          <p className="font-medium">{p.name}</p>
                          <p className="mt-1 text-muted-foreground tabular-nums">
                            {money(p.income)} · {formatPercent(p.incomeShare)} · part{" "}
                            {money(p.due)}
                          </p>
                          <p className="text-muted-foreground tabular-nums">
                            perso {money(p.personalTotal)} · reste à vivre {money(p.leftToLive)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {entry.summary?.transfers?.length ? (
                  <>
                    <Separator />
                    <ul className="flex flex-col gap-1.5">
                      {entry.summary.transfers.map((t, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span className="font-medium">{t.fromName}</span>
                          <ArrowRight className="size-3 text-primary" />
                          <span className="font-medium">
                            {t.toJoint ? s.jointAccountName || "Compte joint" : t.toName}
                          </span>
                          {t.done ? (
                            <Badge variant="success">fait</Badge>
                          ) : (
                            <Badge variant="outline">non coché</Badge>
                          )}
                          <span className="ml-auto font-semibold tabular-nums">
                            {money(t.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {entry.snapshot ? (
                  <>
                    <Separator />
                    <MonthDetail entry={entry} money={money} />
                  </>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function MonthDetail({ entry, money }) {
  const snap = entry.snapshot
  const people = snap.people || []
  const ownerName = (id) => (id === null ? "Commun" : people.find((p) => p.id === id)?.name || "?")
  const chargeRows = (variable) =>
    [...(snap.charges || []).map((c) => ({ ...c, owner: null })), ...(snap.personal || [])]
      .filter((i) => Boolean(i.variable) === variable && i.active !== false)
      .map((i) => ({
        id: i.id,
        label: i.label,
        category: i.category,
        who: ownerName(i.owner ?? null),
        amount: toMonthly(i.amount, i.frequency),
      }))
  const oneOffs = (snap.budgets || [])
    .filter((b) => b.month === entry.month && b.active !== false)
    .map((b) => ({
      id: b.id,
      label: b.label,
      category: b.category,
      who: isReimbursement(b) ? `${ownerName(b.from)} → ${ownerName(b.to)}` : null,
      amount: num(b.amount),
    }))
  const bilan = bilanLines(snap, snap.actuals || {}, { frozen: true })
  const bilanSum = summarize(bilan)

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <DetailList title="Charges fixes" rows={chargeRows(false)} money={money} suffix="/ mois" />
      <DetailList title="Charges variables" rows={chargeRows(true)} money={money} suffix="/ mois" />
      <DetailList title="Ponctuel" rows={oneOffs} money={money} />
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold">
          Bilan
          <span className="ml-2 font-normal text-muted-foreground tabular-nums">
            prévu {money(bilanSum.planned)}
            {bilanSum.count
              ? ` · réel ${money(bilanSum.real)} · ${signed(bilanSum.diff, money)}`
              : ""}
          </span>
        </p>
        {bilan.length ? (
          bilan.map((l) => (
            <div key={l.id} className="flex items-center gap-2 text-xs">
              <CategoryIcon name={l.category} className="size-5" />
              <span className="min-w-0 flex-1 truncate">
                {l.label || "Sans nom"}
                <span className="text-muted-foreground"> · {ownerName(l.owner)}</span>
              </span>
              <span className="text-muted-foreground tabular-nums">{money(l.planned)}</span>
              <span className="w-16 text-right tabular-nums">
                {l.real === null ? "—" : money(l.real)}
              </span>
              <span
                className={cn(
                  "w-16 text-right font-medium tabular-nums",
                  l.diff === null
                    ? "font-normal text-muted-foreground"
                    : l.diff > 0.005
                      ? "text-destructive"
                      : "text-success"
                )}
              >
                {l.diff === null ? "—" : signed(l.diff, money)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Rien.</p>
        )}
      </div>
    </div>
  )
}

function DetailList({ title, rows, money, suffix }) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold">
        {title}
        <span className="ml-2 font-normal text-muted-foreground tabular-nums">
          {money(total)}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </p>
      {rows.length ? (
        rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <CategoryIcon name={r.category} className="size-5" />
            <span className="min-w-0 flex-1 truncate">
              {r.label || "Sans nom"}
              {r.who ? <span className="text-muted-foreground"> · {r.who}</span> : null}
            </span>
            <span className="tabular-nums">{money(r.amount)}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground">Rien.</p>
      )}
    </div>
  )
}
