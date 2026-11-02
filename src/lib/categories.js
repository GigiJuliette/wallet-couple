import {
  Baby,
  BookOpen,
  Building2,
  Car,
  CreditCard,
  Dumbbell,
  Gift,
  HandCoins,
  HeartPulse,
  House,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Plane,
  Repeat,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Tag,
  UtensilsCrossed,
  Zap,
} from "lucide-react"
import { REIMBURSEMENT } from "@/lib/calc"

export const CATEGORY_DEFS = [
  { name: "Logement", family: "blue", icon: House },
  { name: "Énergie", family: "blue", icon: Zap },
  { name: "Télécom", family: "violet", icon: Smartphone },
  { name: "Abonnements", family: "violet", icon: Repeat },
  { name: "Courses", family: "orange", icon: ShoppingCart },
  { name: "Restos", family: "orange", icon: UtensilsCrossed },
  { name: "Santé", family: "green", icon: HeartPulse },
  { name: "Sport & loisirs", family: "green", icon: Dumbbell },
  { name: "Voyages", family: "yellow", icon: Plane },
  { name: "Sorties", family: "yellow", icon: PartyPopper },
  { name: "Culture", family: "yellow", icon: BookOpen },
  { name: "Cadeaux", family: "rose", icon: Gift },
  { name: "Enfants", family: "rose", icon: Baby },
  { name: "Animaux", family: "rose", icon: PawPrint },
  { name: "Crédit", family: "red", icon: CreditCard },
  { name: "Impôts", family: "red", icon: Building2 },
  { name: "Assurances", family: "red", icon: ShieldCheck },
  { name: "Transport", family: "gray", icon: Car },
  { name: "Épargne", family: "gray", icon: PiggyBank },
  { name: "Autre", family: "gray", icon: Tag },
  { name: REIMBURSEMENT, family: "green", icon: HandCoins, oneOffOnly: true },
]

export const CATEGORIES = CATEGORY_DEFS.filter((c) => !c.oneOffOnly).map((c) => c.name)
export const ONE_OFF_CATEGORIES = CATEGORY_DEFS.map((c) => c.name)

const FALLBACK = CATEGORY_DEFS.find((c) => c.name === "Autre")

export function categoryOf(name) {
  return CATEGORY_DEFS.find((c) => c.name === name) || FALLBACK
}

export function categoryColor(name) {
  return `var(--cat-${categoryOf(name).family})`
}
