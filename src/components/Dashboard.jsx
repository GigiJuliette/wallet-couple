import {
  ArrowRight,
  Banknote,
  HeartHandshake,
  Landmark,
  PiggyBank,
  Receipt,
  RotateCcw,
  Save,
  UserRound,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState, StatCard } from "@/components/common"
import { formatMoney, formatPercent, monthLabel } from "@/lib/calc"

export function Dashboard({ data, result, month, onArchive, onGoTo, onToggleTransfer, onClearMonth }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const hasPool = result.poolTotal > 0
  const jointName = s.jointAccountName || "Compte joint"
  const jointTransfers = result.transfers.filter((t) => t.toJoint)
  const peerTransfers = result.transfers.filter((t) => !t.toJoint)

  const done = data.done[month] || {}
  const doneCount = result.transfers.filter((t) => done[t.id]).length
  const allDone = result.transfers.length > 0 && doneCount === result.transfers.length

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Revenus nets du foyer"
          value={money(result.totalIncome)}
          hint={`${data.people.length} personne${data.people.length > 1 ? "s" : ""}`}
          icon={Banknote}
        />
        <StatCard
          label="Charges communes"
          value={money(result.chargesTotal)}
          hint="ramené au mois"
          icon={Receipt}
        />
        <StatCard
          label="Plaisirs communs"
          value={money(result.pleasureTotal)}
          hint="enveloppes du mois"
          icon={HeartHandshake}
        />
        <StatCard
          label="Total à couvrir"
          value={money(result.poolTotal)}
          hint={
            result.totalIncome > 0
              ? `${formatPercent(result.poolTotal / result.totalIncome)} des revenus`
              : "renseignez vos revenus"
          }
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Cagnotte"
          value={money(result.savings.total)}
          hint={
            result.savings.monthCount
              ? `mis de côté sur ${result.savings.monthCount} mois`
              : "aucun versement enregistré"
          }
          icon={PiggyBank}
          tone="success"
        />
      </div>

      <Card className="overflow-hidden border-primary/25">
        <CardHeader className="bg-accent/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="size-4 text-primary" />
                Les virements du début de mois
              </CardTitle>
              <CardDescription>
                {monthLabel(month, s.locale)} · qui envoie quoi, et à qui
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {doneCount > 0 ? (
                <Button size="sm" variant="ghost" onClick={() => onClearMonth(month)}>
                  <RotateCcw />
                  Tout décocher
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
          {!hasPool ? (
            <EmptyState
              icon={Receipt}
              title="Rien à répartir pour le moment"
              description="Ajoutez vos charges communes et vos enveloppes plaisir, le calcul se fait tout seul."
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
                  value={(doneCount / result.transfers.length) * 100}
                  className="h-1.5 min-w-0 flex-1"
                  indicatorClassName={allDone ? "bg-success" : undefined}
                />
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    allDone ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {doneCount} sur {result.transfers.length} fait
                  {doneCount > 1 ? "s" : ""}
                </span>
              </div>

              {jointTransfers.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Vers le {jointName.toLowerCase()}
                  </p>
                  {jointTransfers.map((t) => (
                    <TransferLine
                      key={t.id}
                      transfer={t}
                      settings={s}
                      jointName={jointName}
                      done={done[t.id]}
                      onToggle={() => onToggleTransfer(month, t.id, t.amount)}
                    />
                  ))}
                </div>
              ) : null}

              {peerTransfers.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Entre vous, pour les charges avancées sur un compte perso
                  </p>
                  {peerTransfers.map((t) => (
                    <TransferLine
                      key={t.id}
                      transfer={t}
                      settings={s}
                      jointName={jointName}
                      done={done[t.id]}
                      onToggle={() => onToggleTransfer(month, t.id, t.amount)}
                    />
                  ))}
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

function TransferLine({ transfer: t, settings, jointName, done, onToggle }) {
  const money = (v) => formatMoney(v, settings)
  const netted = !t.toJoint && t.counterGross > 0.005
  const drifted = done && Math.abs(done.amount - t.amount) > 0.005
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
        done ? "border-success/30 bg-success/[0.06]" : "border-border bg-background/60"
      )}
    >
      <Checkbox
        checked={Boolean(done)}
        onCheckedChange={onToggle}
        aria-label={`Marquer le virement de ${t.fromName} comme fait`}
      />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
        <span className={cn("font-medium", done && "text-muted-foreground")}>{t.fromName}</span>
        <ArrowRight className="size-3.5 shrink-0 text-primary" />
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
        {done ? (
          <Badge variant="success">
            fait le{" "}
            {new Date(done.at).toLocaleDateString(settings.locale || "fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        ) : null}
        {drifted ? (
          <Badge variant="destructive">coché pour {money(done.amount)}</Badge>
        ) : null}
      </span>
      <span
        className={cn(
          "text-base font-semibold tabular-nums",
          done ? "text-muted-foreground line-through" : "text-primary"
        )}
      >
        {money(t.amount)}
      </span>
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
          <Badge variant="outline">{formatPercent(p.incomeShare)} des revenus</Badge>
        </div>
        <CardDescription>{money(p.income)} net par mois</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Row label="Sa part du commun" value={money(p.due)} strong />
        <Row label="Ce qu'il avance sur son compte perso" value={money(p.paidDirect)} />
        <Separator />
        <Row
          label={`À virer vers le ${jointName.toLowerCase()}`}
          value={money(p.toJoint)}
          accent
        />
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
