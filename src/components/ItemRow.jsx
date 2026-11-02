import * as React from "react"
import { ChevronDown, Copy, Landmark, Trash2, UserRound } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CategoryBadge,
  CategoryIcon,
  Field,
  FrequencySelect,
  MoneyInput,
  PayerSelect,
  SplitSelect,
} from "@/components/common"
import { cn } from "@/lib/utils"
import { CATEGORIES, categoryColor } from "@/lib/categories"
import {
  JOINT,
  formatMoney,
  formatPercent,
  frequencyOf,
  monthLabel,
  num,
  toMonthly,
} from "@/lib/calc"

export function ItemRow({
  item,
  people,
  settings,
  computed,
  variant = "shared",
  showCategory = true,
  defaultOpen = false,
  onUpdate,
  onRemove,
  onDuplicate,
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const personal = variant === "personal"
  const oneShot = Boolean(item.month)
  const monthly = oneShot ? num(item.amount) : toMonthly(item.amount, item.frequency)
  const freq = frequencyOf(item.frequency)
  const jointName = settings.jointAccountName || "Compte joint"
  const owner = people.find((p) => p.id === item.owner)
  const payerName =
    item.payer === JOINT ? jointName : people.find((p) => p.id === item.payer)?.name || jointName
  const inactive = item.active === false

  return (
    <Card
      className={cn("transition", inactive && "opacity-55")}
      style={
        showCategory
          ? {
              background: `color-mix(in oklch, ${categoryColor(item.category)} 7%, var(--card))`,
              borderColor: `color-mix(in oklch, ${categoryColor(item.category)} 25%, var(--border))`,
            }
          : undefined
      }
    >
      <CardContent className="@container flex flex-col gap-3 pt-4">
        <div className="grid grid-cols-2 items-end gap-3 @2xl:grid-cols-12">
          <div className="col-span-2 flex items-center gap-3 @2xl:col-span-4">
            <Switch
              checked={item.active !== false}
              onCheckedChange={(v) => onUpdate({ active: v })}
              aria-label="Activer cette ligne"
            />
            <Input
              value={item.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Intitulé"
              className="font-medium"
            />
          </div>

          <div className="@2xl:col-span-2">
            <MoneyInput
              value={item.amount}
              currency={settings.currency}
              onChange={(v) => onUpdate({ amount: v })}
            />
          </div>

          <div className="@2xl:col-span-3">
            {oneShot ? (
              <p className="flex h-9 items-center text-sm text-muted-foreground">une seule fois</p>
            ) : (
              <FrequencySelect
                value={item.frequency}
                onChange={(v) => onUpdate({ frequency: v })}
              />
            )}
          </div>

          <div className="col-span-2 flex items-center justify-between gap-2 @2xl:col-span-3">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{oneShot ? "ce mois-ci" : "ramené au mois"}</p>
              <p className="truncate text-sm font-semibold tabular-nums">
                {formatMoney(monthly, settings)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setOpen((o) => !o)}
                aria-label="Détails"
              >
                <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
              </Button>
              {onDuplicate ? (
                <Button size="icon-sm" variant="ghost" onClick={onDuplicate} aria-label="Dupliquer">
                  <Copy />
                </Button>
              ) : null}
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label="Supprimer"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {personal ? (
            <>
              <Badge variant="soft">
                <UserRound />
                {owner ? `pour ${owner.name}` : "sans propriétaire"}
              </Badge>
              {item.deduct ? <Badge variant="outline">retiré du calcul</Badge> : null}
            </>
          ) : (
            <>
              <Badge variant={item.payer === JOINT ? "soft" : "outline"}>
                {item.payer === JOINT ? <Landmark /> : null}
                {item.payer === JOINT ? jointName : `payé par ${payerName}`}
              </Badge>
              <Badge variant="outline">{splitLabel(item, settings)}</Badge>
            </>
          )}
          {showCategory ? <CategoryBadge name={item.category} /> : null}
          {oneShot ? (
            <Badge variant="outline">{monthLabel(item.month, settings.locale)}</Badge>
          ) : null}
          {!oneShot && freq.value !== "monthly" ? (
            <Badge variant="outline">{`${formatMoney(item.amount, settings)} ${freq.short}`}</Badge>
          ) : null}
        </div>

        {open ? (
          <>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {personal ? (
                <Field label="C'est la charge de qui">
                  <Select value={item.owner || ""} onValueChange={(v) => onUpdate({ owner: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
              {personal ? (
                <Field label="Retirer du revenu pour le calcul du %">
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={Boolean(item.deduct)}
                      onCheckedChange={(v) => onUpdate({ deduct: v })}
                      aria-label="Retirer du revenu pour le calcul du pourcentage"
                    />
                  </div>
                </Field>
              ) : (
                <>
                  <Field label="Prélevé sur quel compte">
                    <PayerSelect
                      value={item.payer}
                      onChange={(v) => onUpdate({ payer: v })}
                      people={people}
                      jointLabel={jointName}
                    />
                  </Field>
                  <Field label="Comment on partage cette ligne">
                    <SplitSelect
                      value={item.split}
                      onChange={(v) => onUpdate({ split: v })}
                      defaultMode={settings.defaultSplit}
                    />
                  </Field>
                </>
              )}
              {showCategory ? (
                <Field label="Catégorie">
                  <Select
                    value={item.category || "Autre"}
                    onValueChange={(v) => onUpdate({ category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          <span className="flex items-center gap-2">
                            <CategoryIcon name={c} className="size-5" />
                            {c}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
              <Field label="Note" className="sm:col-span-2 lg:col-span-3">
                <Input
                  value={item.note || ""}
                  onChange={(e) => onUpdate({ note: e.target.value })}
                  placeholder="Date de prélèvement, référence, remarque..."
                />
              </Field>
            </div>

            {!personal && item.split === "custom" ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium">Parts manuelles</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {people.map((p) => (
                    <Field key={p.id} label={p.name}>
                      <div className="relative">
                        <Input
                          inputMode="decimal"
                          value={item.customShares?.[p.id] ?? ""}
                          placeholder="0"
                          className="pr-7 text-right tabular-nums"
                          onChange={(e) =>
                            onUpdate({
                              customShares: {
                                ...(item.customShares || {}),
                                [p.id]: num(e.target.value),
                              },
                            })
                          }
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                    </Field>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Les valeurs sont ramenées à 100 % automatiquement, pas besoin que ça tombe juste.
                </p>
              </div>
            ) : null}

            {!personal && computed ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium">Part de chacun sur cette ligne</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {people.map((p) => (
                    <span key={p.id} className="text-xs tabular-nums">
                      <span className="text-muted-foreground">{p.name} : </span>
                      <span className="font-medium">
                        {formatMoney(computed.monthly * (computed.weights[p.id] || 0), settings)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        ({formatPercent(computed.weights[p.id] || 0, 0)})
                      </span>
                    </span>
                  ))}
                </div>
                {item.payer !== JOINT ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {payerName} avance les {formatMoney(computed.monthly, settings)} depuis son
                    compte perso, les autres lui remboursent leur part.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function splitLabel(item, settings) {
  const mode = item.split && item.split !== "inherit" ? item.split : settings.defaultSplit
  if (mode === "equal") return "moitié-moitié"
  if (mode === "custom") return "parts manuelles"
  return "prorata"
}
