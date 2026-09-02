import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FREQUENCIES, JOINT, SPLIT_MODES, currencySymbol, num } from "@/lib/calc"

export function StatCard({ label, value, hint, icon: Icon, tone = "default", className }) {
  const tones = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    muted: "text-muted-foreground",
  }
  return (
    <Card className={className}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p
              className={cn(
                "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
                tones[tone]
              )}
            >
              {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {Icon ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function MoneyInput({ value, onChange, currency = "EUR", className, ...props }) {
  const [draft, setDraft] = React.useState(null)
  const text = draft ?? formatEditable(value)

  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        value={text}
        onFocus={() => setDraft(formatEditable(value))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,-]/g, "")
          setDraft(raw)
          onChange(num(raw))
        }}
        className={cn("pr-8 text-right tabular-nums", className)}
        {...props}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        {currencySymbol(currency)}
      </span>
    </div>
  )
}

function formatEditable(v) {
  const n = num(v)
  if (n === 0) return ""
  return String(n)
}

export function FrequencySelect({ value, onChange }) {
  return (
    <Select value={value || "monthly"} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FREQUENCIES.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PayerSelect({ value, onChange, people, jointLabel = "Compte joint" }) {
  return (
    <Select value={value || JOINT} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={JOINT}>{jointLabel}</SelectItem>
        <SelectSeparator />
        {people.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} (compte perso)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SplitSelect({ value, onChange, defaultMode }) {
  const inherited = SPLIT_MODES.find((m) => m.value === defaultMode)?.label || "Prorata"
  return (
    <Select value={value || "inherit"} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="inherit">Règle par défaut ({inherited.toLowerCase()})</SelectItem>
        <SelectSeparator />
        {SPLIT_MODES.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      {Icon ? (
        <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
      ) : null}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children, className, hint }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted-foreground/80">{hint}</span> : null}
    </div>
  )
}

export function SharesBar({ people, className }) {
  const total = people.reduce((s, p) => s + Math.max(0, p.value), 0)
  return (
    <div className={cn("flex h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      {people.map((p) => (
        <div
          key={p.id}
          style={{
            width: `${total > 0 ? (Math.max(0, p.value) / total) * 100 : 0}%`,
            background: p.color,
          }}
          title={`${p.name}`}
        />
      ))}
    </div>
  )
}
