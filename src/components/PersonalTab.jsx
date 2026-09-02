import { Plus, Sparkles, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, StatCard } from "@/components/common"
import { ItemRow } from "@/components/ItemRow"
import { formatMoney, formatPercent } from "@/lib/calc"

const PRESETS = ["Salle de sport", "Téléphone", "Abonnement musique", "Crédit voiture", "Mutuelle"]

export function PersonalTab({ data, result, onAdd, onUpdate, onRemove, onDuplicate }) {
  const s = data.settings
  const money = (v) => formatMoney(v, s)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Charges perso</h2>
          <p className="text-xs text-muted-foreground">
            Ce que chacun paie de son côté et qui n'est pas partagé. Ça ne change pas le prorata,
            mais ça change le reste à vivre.
          </p>
        </div>
        <Button size="sm" onClick={() => onAdd()}>
          <Plus />
          Ajouter une charge perso
        </Button>
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

      {data.personal.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="Aucune charge perso enregistrée"
          description="Le sport, le téléphone, un crédit : tout ce que vous payez chacun de votre côté sans le partager."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((label) => (
                <Button key={label} size="sm" variant="outline" onClick={() => onAdd({ label })}>
                  <Sparkles />
                  {label}
                </Button>
              ))}
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {data.people.map((person) => {
            const items = data.personal.filter((i) => i.owner === person.id)
            const computed = result.people.find((p) => p.id === person.id)
            if (items.length === 0) return null
            return (
              <div key={person.id} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: computed?.color }}
                    />
                    {person.name}
                    <span className="font-normal text-muted-foreground">
                      {items.length} ligne{items.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                  <span className="text-xs font-semibold tabular-nums">
                    {money(computed?.personalTotal || 0)} / mois
                  </span>
                </div>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    people={data.people}
                    settings={s}
                    variant="personal"
                    onUpdate={(patch) => onUpdate(item.id, patch)}
                    onRemove={() => onRemove(item.id)}
                    onDuplicate={() => onDuplicate(item.id)}
                  />
                ))}
              </div>
            )
          })}

          {data.personal.some((i) => !data.people.find((p) => p.id === i.owner)) ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground">Sans propriétaire</h3>
              {data.personal
                .filter((i) => !data.people.find((p) => p.id === i.owner))
                .map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    people={data.people}
                    settings={s}
                    variant="personal"
                    onUpdate={(patch) => onUpdate(item.id, patch)}
                    onRemove={() => onRemove(item.id)}
                    onDuplicate={() => onDuplicate(item.id)}
                  />
                ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
