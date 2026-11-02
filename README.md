# walletOrg

Petite app pour organiser les comptes perso et le compte joint d'un couple.

## Lancer

```bash
npm install
npm run dev
```

## Ce que ça fait

1. Vous entrez vos revenus nets (+ autres revenus éventuels).
2. Vous listez les charges communes, en précisant **sur quel compte elles sont prélevées**
   (compte joint ou compte perso de l'un de vous).
3. Vous ajoutez les plaisirs communs du mois (un resto, un week-end…). Ils ne comptent que
   pour le mois où ils sont créés. Ce qui revient chaque mois est une charge.
4. L'app calcule le pourcentage de chacun et affiche **les virements du début de mois**.
   Chaque virement se coche quand il est fait, avec la date.
5. Les charges perso (sport, téléphone, crédit) se listent à part : pas partagées, mais
   comptées dans le reste à vivre de chacun.
6. La cagnotte se remplit à la main, un versement (ou un retrait) par mois. Le total cumulé
   monte tout seul.
7. En fin de mois, vous archivez — à la main, parce que la cagnotte se remplit après les
   virements. Cocher tous les virements n'archive rien.

## Vérifier / builder

```bash
npm run lint
npm run build
```

## Le calcul

```
revenu de chacun ÷ revenus du foyer = son pourcentage
son pourcentage × total commun      = sa part
```

Cette part se paie en deux endroits distincts :

```
charges prélevées sur le compte joint  → virement vers le compte joint
charges avancées par l'autre en perso  → remboursement direct à l'autre
```

Si vous vous devez de l'argent tous les deux, l'app ne demande qu'un seul virement :
la différence. Le détail ligne par ligne reste affiché.

```
reste à vivre = revenu − sa part du commun − ses charges perso
```

Chaque ligne peut avoir sa propre règle de partage : prorata, moitié-moitié, ou
pourcentages manuels. La règle par défaut se change dans Réglages.

Les montants non mensuels (par an, par trimestre…) sont ramenés au mois automatiquement.

## Les données

Tout reste dans le navigateur, sous la clé `walletOrg` du localStorage. Rien ne sort de
la machine. Export / import en fichier JSON depuis l'onglet Réglages.
