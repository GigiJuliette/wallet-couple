import { ArrowRight, History, RotateCcw, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/common"
import { formatMoney, formatPercent, monthLabel } from "@/lib/calc"

export function HistoryTab({ data, month, onArchive, onRemove, onRestore }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Historique des mois</h2>
          <p className="text-xs text-muted-foreground">
            Une photo de vos revenus, charges et virements, mois par mois.
          </p>
        </div>
        <Button size="sm" onClick={() => onArchive(month)}>
          <Save />
          Archiver {monthLabel(month, s.locale).toLowerCase()}
        </Button>
      </div>

      {data.history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Aucun mois archivé"
          description="Archivez le mois en cours pour garder une trace de qui a viré quoi."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.history.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {monthLabel(entry.month, s.locale)}
                    </CardTitle>
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
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(entry.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">
                    revenus {money(entry.summary?.totalIncome)}
                  </Badge>
                  <Badge variant="outline">charges {money(entry.summary?.chargesTotal)}</Badge>
                  <Badge variant="outline">plaisirs {money(entry.summary?.pleasureTotal)}</Badge>
                  <Badge variant="soft">commun {money(entry.summary?.poolTotal)}</Badge>
                  {entry.summary?.personalTotalAll ? (
                    <Badge variant="outline">
                      perso {money(entry.summary.personalTotalAll)}
                    </Badge>
                  ) : null}
                </div>

                {entry.summary?.people?.length ? (
                  <>
                    <Separator />
                    <div className="grid gap-2 sm:grid-cols-2">
                      {entry.summary.people.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs"
                        >
                          <p className="font-medium">{p.name}</p>
                          <p className="mt-1 text-muted-foreground tabular-nums">
                            {money(p.income)} · {formatPercent(p.incomeShare)} · part{" "}
                            {money(p.due)}
                          </p>
                          <p className="text-muted-foreground tabular-nums">
                            perso {money(p.personalTotal)} · reste à vivre{" "}
                            {money(p.leftToLive)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
