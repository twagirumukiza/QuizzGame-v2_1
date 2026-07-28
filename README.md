# BuzzArena — jeu de quiz multijoueur en ligne

## Fonctionnalités
- Création d’un salon et partage d’un lien `?room=CODE`.
- Salon multijoueur synchronisé avec Firebase Realtime Database.
- Trois thèmes : culture générale, culture contemporaine et histoire.
- Manche 1 de 10 questions : 6 normales, 3 doubles et 1 triple, placées au hasard.
- Classement après chaque question selon la justesse et la rapidité.
- Finale entre les deux meilleurs sur 6 questions.
- Question décisive en cas d’égalité.
- Sons activables ou désactivables indépendamment sur chaque appareil.
- Interface responsive mobile, tablette et ordinateur.

## Mise en ligne rapide avec GitHub Pages
1. Créez un projet sur Firebase et activez **Realtime Database**.
2. Ajoutez une application Web dans Firebase.
3. Copiez la configuration dans `firebase-config.js`.
4. Utilisez temporairement ces règles de test dans Realtime Database :

```json
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Ces règles sont adaptées à un prototype, pas à une version publique définitive. Pour une production, ajoutez Firebase Authentication et des règles limitant les écritures aux joueurs du salon.

5. Déposez tous les fichiers sur GitHub puis activez **Settings > Pages > Deploy from a branch**.

## Génération de questions par IA
Cette version fonctionne immédiatement avec une banque locale intégrée, ce qui évite d’exposer une clé API dans le navigateur. Pour une génération réellement dynamique par IA, ajoutez un service serveur ou une fonction cloud qui appelle votre fournisseur d’IA avec une clé stockée côté serveur, puis remplacez `buildQuestionSet()` par un appel à cet endpoint.

## Test sans Firebase
Sans configuration Firebase, le jeu démarre en mode démonstration local avec un joueur simulé. La création et le partage de vrais salons nécessitent Firebase.


V2 roadmap: ajout du thème 7e Art, aucune répétition entre les manches, finale avec nouvelles questions.


## V2.1
- Ajout du concept "Présentateur TV IA".
- Annonces d'ouverture, questions DOUBLE/TRIPLE, suspense et champion.
- Intégration prévue des sons et confettis.
- Nouveau thème : 7e Art (Films & Séries cultes).
- Objectif : ambiance d'émission télévisée.

## V3 — by twagirumukiza

Le mode **Présentateur TV IA** est maintenant pleinement implémenté (module `presenter.js`) :

**Présentation & animation**
- Présentation des joueurs à l'ouverture de la partie, puis annonce du thème choisi.
- Annonce de chaque question (normale, DOUBLE ×2, TRIPLE ×3) avec formulations variées.
- Commentaires pendant le chronomètre (mi-temps, dernières secondes).
- Analyse automatique après chaque question : prise de tête, remontée spectaculaire, temps de réponse remarquable, question piège, message de motivation quand l'écart est serré ou qu'il ne reste que 1-2 questions.
- Annonce des deux finalistes, présentation de la finale, puis annonce du champion avec suspense.

**Ambiance télévisée**
- Voix off en français via la Web Speech API (voix du navigateur), avec sous-titres affichés dans un bandeau animé — fonctionne même si la synthèse vocale n'est pas disponible.
- Roulement de tambour et son de suspense **synthétisés en direct** (Web Audio API), sans fichier audio supplémentaire à héberger.
- Confettis animés (canvas) et ralenti (slow-motion CSS) lors de la révélation du champion.
- Musique d'ambiance, buzz, décompte et fanfare reprennent les sons déjà intégrés au jeu (V1/V2).

**Réglages par joueur**
- Bouton 🎙️ dans l'en-tête : active/désactive le présentateur (voix, bandeau, tambour, suspense, confettis) indépendamment sur chaque appareil.
- Bouton 🔊 existant : coupe uniquement l'audio (voix et sons), les sous-titres restent visibles.
- Les deux préférences sont mémorisées localement (`localStorage`) et persistent d'une session à l'autre.

**Compatibilité**
- 100% statique : GitHub Pages, Firebase Realtime Database pour le multijoueur, aucune dépendance serveur supplémentaire.
- Responsive mobile / tablette / ordinateur, y compris le bandeau du présentateur et les confettis.
