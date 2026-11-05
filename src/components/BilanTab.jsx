import * as React from "react"
import { Input } from "@/components/ui/input"
import { CategoryIcon } from "@/components/common"
import { categoryColor } from "@/lib/categories"
import { bilanLines, signed, summarize } from "@/lib/bilan"
import {
  PERSON_COLORS,
  currencySymbol,
  currentMonthKey,
  formatMoney,
  monthLabel,
  num,
  shiftMonth,
} from "@/lib/calc"
import { cn } from "@/lib/utils"

export function BilanTab({ data, onSetActual }) {
  const now = currentMonthKey()
  const months = [
    ...new Set([now, shiftMonth(now, -1), ...Object.keys(data.actuals).filter((m) => m <= now)]),
  ]
    .sort()
    .reverse()

  return (
    <div className="flex flex-col gap-10">
      {months.map((month) => (
        <BilanMonth
          key={month}
          data={data}
          month={month}
          frozen={month < now}
          onSetActual={onSetActual}
        />
      ))}
    </div>
  )
}

function BilanMonth({ data, month, frozen, onSetActual }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const lines = bilanLines(data, data.actuals[month], { frozen })

  const section = (key, title, dot, own, emptyText) => {
    const sub = summarize(own)
    return (
      <section key={key} className="flex flex-col gap-2.5">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold">
          {dot}
          {title}
          <span className="font-normal text-muted-foreground tabular-nums">
            prévu {money(sub.planned)}
            {sub.count ? ` · réel ${money(sub.real)} · ${signed(sub.diff, money)}` : ""}
          </span>
        </h3>
        {own.length ? (
          own.map((l) => (
            <BilanLine
              key={l.id}
              line={l}
              money={money}
              currency={s.currency}
              onChange={(v) =>
                onSetActual(month, l.id, v, {
                  planned: l.planned,
                  label: l.label,
                  category: l.category,
                  owner: l.owner,
                })
              }
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Bilan · {monthLabel(month, s.locale)}</h2>
        {section(
          "commun",
          "Commun",
          <span className="size-2.5 rounded-full bg-primary" />,
          lines.filter((l) => l.owner === null),
          "Aucune charge commune variable.",
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {data.people.map((p, index) =>
          section(
            p.id,
            p.name,
            <span
              className="size-2.5 rounded-full"
              style={{ background: p.color || PERSON_COLORS[index % PERSON_COLORS.length] }}
            />,
            lines.filter((l) => l.owner === p.id),
            `Aucune charge perso variable pour ${p.name}.`,
          ),
        )}
      </div>
    </div>
  )
}

function BilanLine({ line, money, currency, onChange }) {
  const { label, category, planned, real, diff } = line
  const color = categoryColor(category)
  return (
    <div
      className="@container flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-1.5 shadow-sm shadow-black/[0.03]"
      style={{
        background: `color-mix(in oklab, ${color} 7%, var(--card))`,
        borderColor: `color-mix(in oklab, ${color} 25%, var(--border))`,
      }}
    >
      <CategoryIcon name={category} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label || "Sans nom"}</span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        <span className="hidden @md:inline">prévu </span>
        {money(planned)}
      </span>
      <ActualInput value={real} currency={currency} onChange={onChange} />
      <span
        className={cn(
          "w-16 shrink-0 text-right text-xs tabular-nums",
          diff === null
            ? "text-muted-foreground"
            : diff > 0.005
              ? "font-medium text-destructive"
              : "font-medium text-success",
        )}
      >
        {diff === null ? "—" : signed(diff, money)}
      </span>
    </div>
  )
}

function ActualInput({ value, currency, onChange }) {
  const [draft, setDraft] = React.useState(null)
  const text = draft ?? (value === null ? "" : String(value))
  return (
    <span className="relative shrink-0">
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
        className="h-7 w-20 pr-5 pl-2 text-right text-xs tabular-nums"
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
        {currencySymbol(currency)}
      </span>
    </span>
  )
}
