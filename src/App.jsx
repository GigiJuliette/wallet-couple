import * as React from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  History,
  LayoutDashboard,
  Moon,
  PiggyBank,
  Receipt,
  Settings,
  Sun,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dashboard } from "@/components/Dashboard";
import { PeopleTab } from "@/components/PeopleTab";
import { ChargesTab } from "@/components/ChargesTab";
import { PleasureTab } from "@/components/PleasureTab";
import { PersonalTab } from "@/components/PersonalTab";
import { SavingsTab } from "@/components/SavingsTab";
import { HistoryTab } from "@/components/HistoryTab";
import { SettingsTab } from "@/components/SettingsTab";
import { StatsTab } from "@/components/StatsTab";
import { useWallet } from "@/hooks/useWallet";
import { currentMonthKey, monthLabel } from "@/lib/calc";

function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

export default function App() {
  const [month, setMonth] = React.useState(() => currentMonthKey());
  const wallet = useWallet(month);
  const { data, result } = wallet;
  const [tab, setTab] = React.useState("dashboard");
  const pleasureCount = data.budgets.filter((b) => b.month === month).length;

  const dark = data.settings.theme === "dark";

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {data.settings.householdName || "Notre foyer"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Organisation des comptes perso et du compte joint
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  wallet.clearLastAdded();
                  setMonth((m) => shiftMonth(m, -1));
                }}
                aria-label="Mois précédent"
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-[7.5rem] px-1 text-center text-xs font-medium">
                {monthLabel(month, data.settings.locale)}
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  wallet.clearLastAdded();
                  setMonth((m) => shiftMonth(m, 1));
                }}
                aria-label="Mois suivant"
              >
                <ChevronRight />
              </Button>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                wallet.setSetting("theme", dark ? "light" : "dark")
              }
              aria-label="Changer le thème"
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            wallet.clearLastAdded();
            setTab(v);
          }}
          className="flex flex-col gap-5"
        >
          <TabsList>
            <TabsTrigger value="dashboard">
              <LayoutDashboard />
              Vue du mois
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="people">
              <Users />
              Revenus
            </TabsTrigger>
            <TabsTrigger value="charges">
              <Receipt />
              Charges
              {data.charges.length ? (
                <Badge variant="secondary" className="ml-0.5">
                  {data.charges.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="pleasure">
              <HeartHandshake />
              Plaisirs
              {pleasureCount ? (
                <Badge variant="secondary" className="ml-0.5">
                  {pleasureCount}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="personal">
              <UserRound />
              Perso
              {data.personal.length ? (
                <Badge variant="secondary" className="ml-0.5">
                  {data.personal.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="savings">
              <PiggyBank />
              Cagnotte
            </TabsTrigger>
            <TabsTrigger value="history">
              <History />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings />
              Réglages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              data={data}
              result={result}
              month={month}
              onArchive={wallet.archiveMonth}
              onGoTo={setTab}
              onToggleTransfer={wallet.toggleTransfer}
              onClearMonth={wallet.clearMonthTransfers}
              onAddDebt={wallet.addDebt}
              onUpdateDebt={wallet.updateDebt}
              onRemoveDebt={wallet.removeDebt}
            />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab data={data} result={result} month={month} />
          </TabsContent>

          <TabsContent value="people">
            <PeopleTab
              data={data}
              result={result}
              openId={wallet.lastAdded}
              onAddPersonal={wallet.addPersonal}
              onUpdatePersonal={wallet.updatePersonal}
              onRemovePersonal={wallet.removePersonal}
              onAdd={wallet.addPerson}
              onUpdate={wallet.updatePerson}
              onRemove={wallet.removePerson}
            />
          </TabsContent>

          <TabsContent value="charges">
            <ChargesTab
              data={data}
              result={result}
              openId={wallet.lastAdded}
              onAdd={wallet.addCharge}
              onUpdate={wallet.updateCharge}
              onRemove={wallet.removeCharge}
              onDuplicate={wallet.duplicateCharge}
            />
          </TabsContent>

          <TabsContent value="pleasure">
            <PleasureTab
              data={data}
              result={result}
              month={month}
              openId={wallet.lastAdded}
              onAdd={wallet.addBudget}
              onUpdate={wallet.updateBudget}
              onRemove={wallet.removeBudget}
            />
          </TabsContent>

          <TabsContent value="personal">
            <PersonalTab
              data={data}
              result={result}
              openId={wallet.lastAdded}
              onAdd={wallet.addPersonal}
              onUpdate={wallet.updatePersonal}
              onRemove={wallet.removePersonal}
              onDuplicate={wallet.duplicatePersonal}
            />
          </TabsContent>

          <TabsContent value="savings">
            <SavingsTab
              data={data}
              result={result}
              month={month}
              onAdd={wallet.addSaving}
              onUpdate={wallet.updateSaving}
              onRemove={wallet.removeSaving}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              data={data}
              month={month}
              onArchive={wallet.archiveMonth}
              onRemove={wallet.removeHistory}
              onRestore={wallet.restoreHistory}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              data={data}
              onSetSetting={wallet.setSetting}
              onReset={wallet.reset}
              onImport={wallet.replaceAll}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
