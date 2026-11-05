import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemRow } from "@/components/ItemRow"
import { PersonalColumns } from "@/components/PersonalTab"
import { formatMoney, toMonthly } from "@/lib/calc"

const PRESETS = [
  { label: "Loyer", category: "Logement" },
  { label: "Électricité", category: "Énergie" },
  { label: "Internet", category: "Télécom" },
  { label: "Courses", category: "Courses" },
  { label: "Assurance habitation", category: "Assurances" },
  { label: "Eau", category: "Énergie" },
]

const VARIABLE_PRESETS = [
  { label: "Courses", category: "Courses" },
  { label: "Essence", category: "Transport" },
  { label: "Sorties", category: "Sorties" },
]

export function ChargesTab({
  data,
  openId,
  variable = false,
  onAdd,
  onUpdate,
  onRemove,
  onDuplicate,
  onMakeOneOff,
  personal,
}) {
  const s = data.settings
  const list = data.charges.filter((c) => Boolean(c.variable) === variable)
  const add = (preset = {}) => onAdd({ ...preset, variable })
  const total = list
    .filter((c) => c.active !== false)
    .reduce((sum, c) => sum + toMonthly(c.amount, c.frequency), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          {variable ? "Charges variables" : "Charges fixes"}
        </h2>
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold">
              <span className="size-2.5 rounded-full bg-primary" />
              Commun
              <span className="font-normal text-muted-foreground tabular-nums">
                {formatMoney(total, s)} / mois
              </span>
            </h3>
            <Button size="sm" onClick={() => add()}>
              <Plus />
              Ajouter
            </Button>
          </div>
          {list.length ? (
            list.map((charge) => (
              <ItemRow
                key={charge.id}
                item={charge}
                defaultOpen={charge.id === openId}
                people={data.people}
                settings={s}
                onUpdate={(patch) => onUpdate(charge.id, patch)}
                onRemove={() => onRemove(charge.id)}
                onDuplicate={() => onDuplicate(charge.id)}
                onMakeOneOff={() => onMakeOneOff(charge.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Aucune charge commune {variable ? "variable" : "fixe"}.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {(variable ? VARIABLE_PRESETS : PRESETS).map((p) => (
                  <Button
                    key={p.label}
                    size="sm"
                    variant="outline"
                    onClick={() => add({ label: p.label, category: p.category })}
                  >
                    <Sparkles />
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <PersonalColumns data={data} variable={variable} openId={openId} {...personal} />
    </div>
  )
}
