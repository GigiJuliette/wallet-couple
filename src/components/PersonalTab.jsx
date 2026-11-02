import { Plus, Sparkles, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/common"
import { ItemRow } from "@/components/ItemRow"
import { formatMoney, formatPercent } from "@/lib/calc"

const PRESETS = ["Salle de sport", "Téléphone", "Abonnement musique", "Crédit voiture", "Mutuelle"]

export function PersonalTab({ data, result, openId, onAdd, onUpdate, onRemove, onDuplicate }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)
  const orphans = data.personal.filter((i) => !data.people.find((p) => p.id === i.owner))

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
      <div>
        <h2 className="text-sm font-semibold">Charges perso</h2>
        <p className="text-xs text-muted-foreground">
          Ce que chacun paie de son côté et qui n'est pas partagé. Ça ne change pas le prorata,
          mais ça change le reste à vivre.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total charges perso"
          value={money(result.personalTotalAll)}
          hint="tout le monde confondu"
          icon={UserRound}
          tone="primary"
        />
        {result.people.slice(0, 2).map((p) => (
          <StatCard
            key={p.id}
            label={`Charges perso de ${p.name}`}
            value={money(p.personalTotal)}
            hint={
              p.income > 0
                ? `${formatPercent(p.personalTotal / p.income)} de son revenu`
                : "revenu non renseigné"
            }
          />
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {data.people.map((person) => {
          const items = data.personal.filter((i) => i.owner === person.id)
          const computed = result.people.find((p) => p.id === person.id)
          return (
            <div key={person.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: computed?.color }}
                  />
                  {person.name}
                  <span className="font-normal text-muted-foreground tabular-nums">
                    {money(computed?.personalTotal || 0)} / mois
                  </span>
                </h3>
                <Button size="sm" variant="outline" onClick={() => onAdd({ owner: person.id })}>
                  <Plus />
                  Ajouter
                </Button>
              </div>
              {items.length ? (
                items.map(row)
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Aucune charge perso pour {person.name}.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {PRESETS.map((label) => (
                      <Button
                        key={label}
                        size="sm"
                        variant="outline"
                        onClick={() => onAdd({ label, owner: person.id })}
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
