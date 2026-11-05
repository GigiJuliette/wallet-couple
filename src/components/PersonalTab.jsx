import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemRow } from "@/components/ItemRow"
import { PERSON_COLORS, formatMoney, toMonthly } from "@/lib/calc"

const PRESETS = ["Salle de sport", "Téléphone", "Abonnement musique", "Crédit voiture", "Mutuelle"]
const VARIABLE_PRESETS = ["Shopping", "Sorties"]

export function PersonalColumns({
  data,
  variable,
  openId,
  onAdd,
  onUpdate,
  onRemove,
  onDuplicate,
}) {
  const s = data.settings
  const items = data.personal.filter((i) => Boolean(i.variable) === variable)
  const orphans = items.filter((i) => !data.people.find((p) => p.id === i.owner))
  const totalOf = (list) =>
    list
      .filter((i) => i.active !== false)
      .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)

  const row = (item) => (
    <ItemRow
      key={item.id}
      item={item}
      defaultOpen={item.id === openId}
      people={data.people}
      settings={s}
      variant="personal"
      onUpdate={(patch) => onUpdate(item.id, patch)}
      onRemove={() => onRemove(item.id)}
      onDuplicate={() => onDuplicate(item.id)}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {data.people.map((person, index) => {
          const own = items.filter((i) => i.owner === person.id)
          return (
            <div key={person.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      background: person.color || PERSON_COLORS[index % PERSON_COLORS.length],
                    }}
                  />
                  {person.name}
                  <span className="font-normal text-muted-foreground tabular-nums">
                    {formatMoney(totalOf(own), s)} / mois
                  </span>
                </h3>
                <Button size="sm" onClick={() => onAdd({ owner: person.id, variable })}>
                  <Plus />
                  Ajouter
                </Button>
              </div>
              {own.length ? (
                own.map(row)
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Aucune charge perso {variable ? "variable" : "fixe"} pour {person.name}.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(variable ? VARIABLE_PRESETS : PRESETS).map((label) => (
                      <Button
                        key={label}
                        size="sm"
                        variant="outline"
                        onClick={() => onAdd({ label, owner: person.id, variable })}
                      >
                        <Sparkles />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {orphans.length ? (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground">Sans propriétaire</h3>
          {orphans.map(row)}
        </div>
      ) : null}
    </div>
  )
}
