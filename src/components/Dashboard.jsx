import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Circle,
  X,
  Plus,
  Landmark,
  PiggyBank,
  Receipt,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { EmptyState, MoneyInput } from "@/components/common"
import { formatMoney, formatPercent, monthLabel, paymentProgress } from "@/lib/calc"

export function Dashboard({
  data,
  result,
  month,
  onArchive,
  onGoTo,
  onShiftMonth,
  onAddPayment,
  onRemovePayment,
  onClearMonth,
}) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const hasPool = result.poolTotal > 0
  const jointName = s.jointAccountName || "Compte joint"
  const jointTransfers = result.transfers.filter((t) => t.toJoint)
  const peerTransfers = result.transfers.filter((t) => !t.toJoint)

  const progress = paymentProgress(result.transfers, data.payments, month)
  const allDone = progress.complete
  const lineProps = (t) => ({
    key: t.id,
    transfer: t,
    settings: s,
    jointName,
    progress: progress.byTransfer[t.id],
    onAdd: (amount) => onAddPayment(month, t.id, amount),
    onRemove: onRemovePayment,
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-0.5 self-start rounded-lg border border-border bg-card p-0.5">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onShiftMonth(-1)}
          aria-label="Mois précédent"
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-[7.5rem] px-1 text-center text-xs font-medium">
          {monthLabel(month, s.locale)}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onShiftMonth(1)}
          aria-label="Mois suivant"
        >
          <ChevronRight />
        </Button>
      </div>

      <Card className="overflow-hidden border-primary/25">
        <CardHeader className="bg-accent/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="size-4 text-primary" />
                Les virements du mois
              </CardTitle>
              <CardDescription>
                {monthLabel(month, s.locale)} · qui envoie quoi, et à qui
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {progress.count > 0 ? (
                <Button size="sm" variant="ghost" onClick={() => onClearMonth(month)}>
                  <RotateCcw />
                  Tout remettre à zéro
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => onArchive(month)}>
                <Save />
                Archiver ce mois
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!hasPool && result.transfers.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Rien à répartir pour le moment"
              description="Ajoutez vos charges communes et vos plaisirs du mois, le calcul se fait tout seul."
              action={
                <Button size="sm" onClick={() => onGoTo("charges")}>
                  Ajouter une charge
                </Button>
              }
            />
          ) : result.transfers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun virement nécessaire : tout est déjà équilibré.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Progress
                  value={progress.due > 0 ? (progress.covered / progress.due) * 100 : 0}
                  className="h-1.5 min-w-0 flex-1"
                  indicatorClassName={allDone ? "bg-success" : undefined}
                />
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    allDone ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {money(progress.covered)} sur {money(progress.due)} viré
                </span>
              </div>

              {jointTransfers.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Vers le {jointName.toLowerCase()}
                  </p>
                  {jointTransfers.map((t) => (
                    <TransferLine {...lineProps(t)} />
                  ))}
                </div>
              ) : null}

              {peerTransfers.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Entre vous : charges avancées sur un compte perso et remboursements ponctuels
                  </p>
                  {peerTransfers.map((t) => (
                    <TransferLine {...lineProps(t)} />
                  ))}
                </div>
              ) : null}

              {progress.orphans.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Virements notés qui ne correspondent plus à une ligne (les montants ont changé
                    de sens)
                  </p>
                  <PaymentChips
                    payments={progress.orphans}
                    settings={s}
                    onRemove={onRemovePayment}
                  />
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {result.people.map((p) => (
          <PersonSummary key={p.id} person={p} settings={s} jointName={jointName} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ce qu'il reste pour vous deux</CardTitle>
          <CardDescription>
            Revenus du foyer moins tout le commun et moins les charges perso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <PiggyBank className="size-5 shrink-0 text-primary" />
            <p className="text-2xl font-semibold tabular-nums">{money(result.leftToLiveTotal)}</p>
            <span className="text-xs text-muted-foreground">de reste à vivre cumulé</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {money(result.totalIncome)} de revenus − {money(result.poolTotal)} de commun −{" "}
            {money(result.personalTotalAll)} de charges perso
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function TransferLine({ transfer: t, settings, jointName, progress: p, onAdd, onRemove }) {
  const money = (v) => formatMoney(v, settings)
  const [draft, setDraft] = React.useState(0)
  const netted = !t.toJoint && t.counterGross > 0.005
  const ratio = t.amount > 0 ? Math.min(1, p.paid / t.amount) : 0
  const submit = () => {
    if (draft > 0) {
      onAdd(draft)
      setDraft(0)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border px-3 py-3 transition-colors",
        p.complete ? "border-success/30 bg-success/[0.06]" : "border-border bg-background/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {p.complete ? (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        ) : (
          <Circle className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{t.fromName}</span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
          {t.toJoint ? (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Landmark className="size-3.5 text-muted-foreground" />
              {jointName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <UserRound className="size-3.5 text-muted-foreground" />
              {t.toName}
            </span>
          )}
          {netted ? (
            <Badge variant="outline">
              {money(t.gross)} − {money(t.counterGross)}
            </Badge>
          ) : null}
          {p.extra > 0.005 ? <Badge variant="success">+{money(p.extra)} en plus</Badge> : null}
        </span>
        <span className="text-base font-semibold tabular-nums">{money(t.amount)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Progress
          value={ratio * 100}
          className="h-1.5 min-w-0 flex-1"
          indicatorClassName={p.complete ? "bg-success" : undefined}
        />
        <span className="text-xs tabular-nums text-muted-foreground">
          {money(p.paid)} viré
          {p.remaining > 0.005 ? ` · reste ${money(p.remaining)}` : ""}
        </span>
      </div>

      {p.list.length ? (
        <PaymentChips payments={p.list} settings={settings} onRemove={onRemove} />
      ) : null}

      {!p.complete ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-32">
            <MoneyInput
              key={p.list.length}
              value={draft}
              currency={settings.currency}
              onChange={setDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
              placeholder="Montant"
              aria-label="Montant viré"
            />
          </div>
          <Button size="sm" variant="outline" disabled={!(draft > 0)} onClick={submit}>
            <Plus />
            Noter un virement
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAdd(p.remaining)}>
            <CheckCircle2 />
            Tout payé ({money(p.remaining)})
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-32">
            <MoneyInput
              key={p.list.length}
              value={draft}
              currency={settings.currency}
              onChange={setDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
              placeholder="En plus"
              aria-label="Montant viré en plus"
            />
          </div>
          <Button size="sm" variant="ghost" disabled={!(draft > 0)} onClick={submit}>
            <Plus />
            Noter un virement en plus
          </Button>
        </div>
      )}
    </div>
  )
}

function PaymentChips({ payments, settings, onRemove }) {
  const money = (v) => formatMoney(v, settings)
  return (
    <div className="flex flex-wrap gap-1.5">
      {payments.map((pay) => (
        <span
          key={pay.id}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card py-0.5 pr-0.5 pl-2 text-xs tabular-nums"
        >
          <span className="text-muted-foreground">
            {new Date(pay.at).toLocaleDateString(settings.locale || "fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="font-medium">{money(pay.amount)}</span>
          <button
            type="button"
            onClick={() => onRemove(pay.id)}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
            aria-label="Supprimer ce virement"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  )
}

function PersonSummary({ person: p, settings, jointName }) {
  const money = (v) => formatMoney(v, settings)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </CardTitle>
          <Badge variant="outline">{formatPercent(p.incomeShare)} du calcul</Badge>
        </div>
        <CardDescription>{money(p.income)} net par mois</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Row label="Sa part du commun" value={money(p.due)} strong />
        <Row label="Ce qu'il avance sur son compte perso" value={money(p.paidDirect)} />
        <Separator />
        <Row label={`À virer vers le ${jointName.toLowerCase()}`} value={money(p.toJoint)} accent />
        {p.owesToOthers > 0.005 ? (
          <Row label="À rembourser à l'autre" value={money(p.owesToOthers)} accent />
        ) : null}
        {p.owedByOthers > 0.005 ? (
          <Row label="Que l'autre lui doit" value={money(p.owedByOthers)} success />
        ) : null}
        <Separator />
        {p.personalTotal > 0.005 ? (
          <Row label="Ses charges perso" value={money(p.personalTotal)} />
        ) : null}
        <Row label="Reste à vivre" value={money(p.leftToLive)} strong />
      </CardContent>
    </Card>
  )
}

function Row({ label, value, strong, accent, success }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={[
          "tabular-nums",
          strong ? "font-semibold" : "",
          accent ? "font-semibold text-primary" : "",
          success ? "font-semibold text-success" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  )
}
