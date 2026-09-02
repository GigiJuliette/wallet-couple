import { Plus, Trash2, UserRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Field, MoneyInput, SharesBar } from "@/components/common"
import { PERSON_COLORS, formatMoney, formatPercent } from "@/lib/calc"

export function PeopleTab({ data, result, onAdd, onUpdate, onRemove }) {
  const s = data.settings
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Revenus</h2>
          <p className="text-xs text-muted-foreground">
            C'est cette base qui décide du pourcentage de chacun.
          </p>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus />
          Ajouter une personne
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {data.people.map((person, index) => {
          const computed = result.people.find((p) => p.id === person.id)
          const color = person.color || PERSON_COLORS[index % PERSON_COLORS.length]
          return (
            <Card key={person.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="size-2.5 rounded-full" style={{ background: color }} />
                    {person.name || "Sans nom"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="soft">
                      {formatPercent(computed?.incomeShare || 0)}
                    </Badge>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={data.people.length <= 1}
                      onClick={() => onRemove(person.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Total pris en compte : {formatMoney(computed?.income || 0, s)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label="Prénom" className="sm:col-span-2">
                  <Input
                    value={person.name}
                    onChange={(e) => onUpdate(person.id, { name: e.target.value })}
                    placeholder="Prénom"
                  />
                </Field>
                <Field label="Salaire net par mois">
                  <MoneyInput
                    value={person.netIncome}
                    currency={s.currency}
                    onChange={(v) => onUpdate(person.id, { netIncome: v })}
                  />
                </Field>
                <Field
                  label="Autres revenus par mois"
                  hint="aides, primes lissées, loyers perçus..."
                >
                  <MoneyInput
                    value={person.otherIncome}
                    currency={s.currency}
                    onChange={(v) => onUpdate(person.id, { otherIncome: v })}
                  />
                </Field>
                <Field label="Couleur" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {PERSON_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onUpdate(person.id, { color: c })}
                        className="size-7 rounded-full border-2 transition"
                        style={{
                          background: c,
                          borderColor: color === c ? "var(--foreground)" : "transparent",
                        }}
                        aria-label="Choisir cette couleur"
                      />
                    ))}
                  </div>
                </Field>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-primary" />
            Répartition au prorata
          </CardTitle>
          <CardDescription>
            Chacun met le même pourcentage de son revenu dans le pot commun.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SharesBar
            people={result.people.map((p) => ({
              id: p.id,
              name: p.name,
              value: p.income,
              color: p.color,
            }))}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {result.people.map((p) => (
              <span key={p.id} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatPercent(p.incomeShare)} des revenus
                </span>
              </span>
            ))}
          </div>
          <Separator />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p>salaire net + autres revenus = revenu pris en compte</p>
            <p>revenu de la personne ÷ revenus du foyer = son pourcentage</p>
            <p>son pourcentage × total du commun = ce qu'elle doit mettre</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
