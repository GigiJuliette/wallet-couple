import * as React from "react"
import { ArrowLeftRight, CalendarDays, ChevronDown, Copy, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CategoryIcon,
  Field,
  FrequencySelect,
  MoneyInput,
  PayerSelect,
  SplitSelect,
} from "@/components/common"
import { cn } from "@/lib/utils"
import { CATEGORIES, ONE_OFF_CATEGORIES, categoryColor } from "@/lib/categories"
import { JOINT, formatMoney, isReimbursement, frequencyOf, num, toMonthly } from "@/lib/calc"

export function ItemRow({
  item,
  people,
  settings,
  variant = "shared",
  showCategory = true,
  defaultOpen = false,
  onUpdate,
  onRemove,
  onDuplicate,
  onMakeOneOff,
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const personal = variant === "personal"
  const oneShot = Boolean(item.month)
  const monthly = oneShot ? num(item.amount) : toMonthly(item.amount, item.frequency)
  const freq = frequencyOf(item.frequency)
  const jointName = settings.jointAccountName || "Compte joint"
  const payerName =
    item.payer === JOINT ? jointName : people.find((p) => p.id === item.payer)?.name || jointName
  const inactive = item.active === false
  const debt = isReimbursement(item)
  const nameOf = (id) => people.find((p) => p.id === id)?.name || "?"
  const categories = oneShot ? ONE_OFF_CATEGORIES : CATEGORIES
  const changeCategory = (category) => {
    if (category === item.category) return
    const patch = { category }
    if (isReimbursement({ category })) {
      patch.from = item.from || people[0]?.id
      patch.to =
        item.to && item.to !== patch.from ? item.to : people.find((p) => p.id !== patch.from)?.id
    }
    onUpdate(patch)
  }
  const setShare = (id, raw) => {
    const value = Math.min(100, Math.max(0, num(raw)))
    const next = { ...(item.customShares || {}), [id]: value }
    if (people.length === 2) {
      const other = people.find((p) => p.id !== id)
      next[other.id] = Math.round((100 - value) * 100) / 100
    }
    return next
  }
  const meta = personal
    ? [item.deduct ? "retiré du calcul" : null]
    : debt
      ? [`${nameOf(item.from)} → ${nameOf(item.to)}`]
      : [item.payer === JOINT ? jointName : `payé par ${payerName}`, splitLabel(item, settings)]
  if (!oneShot && freq.value !== "monthly") {
    meta.push(`${formatMoney(item.amount, settings)} ${freq.short}`)
  }
  const metaList = meta.filter(Boolean)

  return (
    <Card
      className={cn("transition", inactive && "opacity-55")}
      style={
        showCategory
          ? {
              background: `color-mix(in oklab, ${categoryColor(item.category)} 7%, var(--card))`,
              borderColor: `color-mix(in oklab, ${categoryColor(item.category)} 25%, var(--border))`,
            }
          : undefined
      }
    >
      <CardContent className="@container flex flex-col px-3 pb-0">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setOpen((o) => !o)
            }
          }}
          className="-mx-3 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-1.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <span onClick={(e) => e.stopPropagation()} className="flex">
            <Switch
              checked={item.active !== false}
              onCheckedChange={(v) => onUpdate({ active: v })}
              aria-label="Activer cette ligne"
            />
          </span>
          {showCategory ? <CategoryIcon name={item.category} /> : null}
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium">{item.label || "Sans nom"}</span>
            {metaList.length ? (
              <span className="hidden text-xs text-muted-foreground @md:inline">
                {metaList.map((m) => ` · ${m}`).join("")}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
            {formatMoney(monthly, settings)}
            {oneShot ? null : (
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">/mois</span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>

        <div
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="-mx-1 min-h-0 overflow-hidden px-1">
            <div className="flex flex-col gap-3 pt-3 pb-3">
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Intitulé">
                  <Input
                    value={item.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="Intitulé"
                    autoFocus={defaultOpen}
                  />
                </Field>
                <Field label="Montant">
                  <MoneyInput
                    value={item.amount}
                    currency={settings.currency}
                    onChange={(v) => onUpdate({ amount: v })}
                  />
                </Field>
                {oneShot ? null : (
                  <Field label="Tous les combien">
                    <FrequencySelect
                      value={item.frequency}
                      onChange={(v) => onUpdate({ frequency: v })}
                    />
                  </Field>
                )}
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
                {personal ? null : debt ? (
                  <>
                    <Field label="Qui doit">
                      <PersonSelect
                        value={item.from}
                        people={people}
                        onChange={(v) => onUpdate({ from: v })}
                      />
                    </Field>
                    <Field label="À qui">
                      <PersonSelect
                        value={item.to}
                        people={people}
                        onChange={(v) => onUpdate({ to: v })}
                      />
                    </Field>
                  </>
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
                    <Select value={item.category || "Autre"} onValueChange={changeCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
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
              </div>

              {personal ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <Switch
                    checked={Boolean(item.deduct)}
                    onCheckedChange={(v) => onUpdate({ deduct: v })}
                  />
                  <span className="text-sm font-medium">Retirer du revenu pour le calcul du %</span>
                </label>
              ) : null}

              {debt && item.from === item.to ? (
                <p className="text-xs text-destructive">Choisis deux personnes différentes.</p>
              ) : null}

              {debt ? (
                <p className="text-xs text-muted-foreground">
                  Ajouté au virement entre vous dans Vue du mois, pour ce mois seulement.
                </p>
              ) : null}

              {!personal && !debt && item.split === "custom" ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Parts manuelles</span>
                  {people.map((p) => (
                    <label key={p.id} className="flex items-center gap-1.5">
                      {p.name}
                      <span className="relative">
                        <Input
                          inputMode="decimal"
                          value={item.customShares?.[p.id] ?? ""}
                          placeholder="0"
                          className="h-7 w-16 pr-5 pl-2 text-right text-xs tabular-nums"
                          onChange={(e) =>
                            onUpdate({ customShares: setShare(p.id, e.target.value) })
                          }
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-1.5">
                {!oneShot ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdate({ variable: !item.variable })}
                  >
                    <ArrowLeftRight />
                    {item.variable ? "Passer en fixe" : "Passer en variable"}
                  </Button>
                ) : null}
                {onMakeOneOff ? (
                  <Button size="sm" variant="outline" onClick={onMakeOneOff}>
                    <CalendarDays />
                    Passer en ponctuel
                  </Button>
                ) : null}
                {onDuplicate ? (
                  <Button size="sm" variant="outline" onClick={onDuplicate}>
                    <Copy />
                    Dupliquer
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={onRemove}
                >
                  <Trash2 />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
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

function PersonSelect({ value, people, onChange }) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
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
  )
}
