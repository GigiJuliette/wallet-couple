import * as React from "react"
import { Download, RotateCcw, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field } from "@/components/common"
import { SPLIT_MODES } from "@/lib/calc"
import { STORAGE_KEY } from "@/lib/storage"

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"]

export function SettingsTab({ data, onSetSetting, onReset, onImport }) {
  const s = data.settings
  const fileRef = React.useRef(null)
  const [importError, setImportError] = React.useState("")

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `walletOrg-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file) => {
    setImportError("")
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || typeof parsed !== "object") throw new Error("format")
        onImport(parsed)
      } catch {
        setImportError("Ce fichier n'est pas un export valide.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Réglages généraux</CardTitle>
          <CardDescription>Ces choix s'appliquent partout dans l'application.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom du foyer">
            <Input
              value={s.householdName || ""}
              onChange={(e) => onSetSetting("householdName", e.target.value)}
              placeholder="Notre foyer"
            />
          </Field>
          <Field label="Nom du compte commun">
            <Input
              value={s.jointAccountName || ""}
              onChange={(e) => onSetSetting("jointAccountName", e.target.value)}
              placeholder="Compte joint"
            />
          </Field>
          <Field label="Monnaie">
            <Select value={s.currency} onValueChange={(v) => onSetSetting("currency", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Règle de partage par défaut"
            hint="chaque ligne peut avoir sa propre règle"
          >
            <Select value={s.defaultSplit} onValueChange={(v) => onSetSetting("defaultSplit", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPLIT_MODES.filter((m) => m.value !== "custom").map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vos données</CardTitle>
          <CardDescription>
            Tout est gardé dans votre navigateur, sous la clé <code>{STORAGE_KEY}</code>. Rien ne
            part sur internet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportJson}>
              <Download />
              Exporter en fichier
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload />
              Importer un fichier
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importJson(file)
                e.target.value = ""
              }}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                  <Trash2 />
                  Tout remettre à zéro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Effacer toutes les données ?</DialogTitle>
                  <DialogDescription>
                    Revenus, charges, plaisirs et historique seront supprimés. Pensez à exporter
                    avant si vous voulez garder une copie.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">
                      Annuler
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive" size="sm" onClick={onReset}>
                      <RotateCcw />
                      Effacer
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {importError ? <p className="text-xs text-destructive">{importError}</p> : null}
          {data.updatedAt ? (
            <p className="text-xs text-muted-foreground">
              Dernière sauvegarde : {new Date(data.updatedAt).toLocaleString(s.locale)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
