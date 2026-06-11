# Prompts Design UX/UI — Gym Tracker PWA

---

## Prompt de base (à inclure dans TOUS les prompts suivants)

```
Tu es un expert UI/UX designer spécialisé dans les applications mobile fitness.
Propose un design entièrement nouveau, sans te baser sur aucun design existant.
Inspire-toi du screenshot joint pour la direction artistique générale (ambiance, palette, typographie) sans le copier à l'identique. Adapte-le au contexte d'une app de musculation.

Livrable attendu : du HTML statique + classes Tailwind CDN uniquement.
- Pas de React, pas de JavaScript, pas de composants, pas de state
- Juste du HTML pur avec des classes Tailwind
- Un seul fichier HTML par écran, avec <script src="https://cdn.tailwindcss.com"></script> en head
- Toutes les données sont fictives et codées en dur dans le HTML
- Les états visuels différents (ex: série validée vs non validée) sont montrés côte à côte dans le même fichier

Contraintes non négociables :
- Mobile-first, largeur 390px simulée (utilise une div centrale de 390px)
- Zones de tap minimum 48x48px (doigts moites pendant l'effort)
- Tous les textes en français
- Fond sombre obligatoire (app de salle, luminosité basse)
```

---

## 1 · Dashboard

```
[Inclure le prompt de base]

Redesign l'écran Dashboard.

Contenu à afficher :
- Dernière séance (muscles travaillés, durée, temps relatif)
- Alertes fréquence musculaire (muscles pas assez entraînés)
- Stats : séances cette semaine, ce mois, temps total, volume total
- Poids corporel (dernier + moyenne 7j)
- Volume hebdomadaire par muscle
- Calendrier d'activité sur 12 semaines
- Accès aux programmes d'entraînement
```

---

## 2 · Séance active

```
[Inclure le prompt de base]

Redesign l'écran de séance active — l'écran utilisé 90% du temps.

Contenu à afficher :
- Chronomètre de séance + bouton Terminer
- Bannière d'erreur si sauvegarde échoue
- Liste des exercices en cours
- Bouton pour ajouter un exercice
- Écran d'accueil quand aucune séance n'est en cours
```

---

## 3 · SetRow — Composant série

```
[Inclure le prompt de base]

Redesign le composant SetRow — touché 30 à 50 fois par séance.

Contenu à afficher :
- Numéro de série ou badge "Échauffement"
- Badge RPE si renseigné
- Bouton chrono manuel, bouton RPE, bouton supprimer
- Input poids en kg avec boutons − et +
- Input reps avec boutons − et +
- Bouton de validation du set (lance le chrono de repos)
- État visuel distinct entre "à faire" et "validé"
```

---

## 4 · Carte d'exercice

```
[Inclure le prompt de base]

Redesign la carte d'exercice pendant la séance.

Contenu à afficher :
- Nom de l'exercice, muscle ciblé, tendance de progression (↗ ↘ →)
- Timer de repos personnalisable
- Mini graphe des 8 dernières séances
- Notes machine et notes d'exercice
- Résultat de la séance précédente et record personnel
- Recommandation de surcharge progressive
- Alerte si plateau ou régression
- Badge nouveau record personnel
- Liste des séries (SetRow)
- Bouton ajouter une série
- Boutons pour réordonner l'exercice
```

---

## 5 · Sélection d'exercice

```
[Inclure le prompt de base]

Redesign l'écran de sélection d'exercice.

Contenu à afficher :
- Navigation retour + titre
- Filtres par groupe musculaire (Tous, Chest, Back, Biceps, Triceps, Abs)
- Grille d'exercices avec GIF animé, nom et muscle
- Accès à une bibliothèque étendue avec recherche
```

---

## 6 · Historique

```
[Inclure le prompt de base]

Redesign l'écran historique des séances.

Contenu à afficher :
- Liste des séances passées avec date, durée, volume total
- Pour chaque séance : exercices réalisés + nombre de séries, cliquables
- Option de suppression par séance
- État vide si aucune séance
```

---

## 7 · Statistiques

```
[Inclure le prompt de base]

Redesign l'écran statistiques.

Contenu à afficher :
- Total de séances, durée moyenne, séance la plus longue, muscle le plus entraîné
- Comparaison volume cette semaine vs semaine précédente par muscle
- Indicateur de fatigue/besoin de décharge sur 5 semaines
- Volume par muscle sur la semaine et le mois
- Nombre de séries par muscle au total
```

---

## 8 · Programmes

```
[Inclure le prompt de base]

Redesign l'écran de gestion des programmes d'entraînement.

Contenu à afficher :
- Liste des programmes avec nom + aperçu des exercices
- Bouton pour lancer une séance depuis un programme
- Options d'édition et de suppression
- Bouton créer un nouveau programme
- État vide

Pour l'éditeur de programme :
- Champ nom
- Ajout et réorganisation d'exercices
- Création de supersets (groupes d'exercices enchaînés)
```

---

## 9 · Poids corporel

```
[Inclure le prompt de base]

Redesign l'écran de suivi du poids corporel.

Contenu à afficher :
- Saisie rapide du poids du jour
- Moyennes sur 7 jours et 30 jours
- Graphe de l'évolution sur les 30 dernières entrées
- Liste des entrées avec modification et suppression
```

---

## 10 · Détail d'un exercice

```
[Inclure le prompt de base]

Redesign l'écran de détail d'un exercice (accessible depuis l'historique).

Contenu à afficher :
- Nom de l'exercice
- Records : poids max, reps max, volume max
- Graphe de progression du poids max par séance
- Notes et réglages machine (collapsible)
- Historique des performances par séance
```

---

## 11 · Timer de repos

```
[Inclure le prompt de base]

Redesign le composant RestTimer — overlay flottant visible sur tous les écrans.

Comportement :
- S'affiche en superposition après validation d'une série
- Compte à rebours visuel
- Tap dessus pour passer le repos
- Disparaît quand le temps est écoulé (avec vibration)
```

---

## 12 · Navigation

```
[Inclure le prompt de base]

Redesign la barre de navigation principale.

Contenu :
- 4 onglets : Accueil, Historique, Stats, Poids
- Bouton central prominent pour démarrer/accéder à la séance
- Indicateur de l'onglet actif
```
