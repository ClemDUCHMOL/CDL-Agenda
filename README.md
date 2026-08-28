# CDL-Agenda — documentation de référence

Dernière mise à jour documentaire : **28 août 2026**.

CDL-Agenda est une application web de publication de disponibilités. Elle expose
un calendrier public en lecture seule et un espace d'administration protégé pour
modifier les créneaux, les paramètres d'affichage et les éléments visuels de
l'en-tête.

Cette documentation décrit le fonctionnement observé dans le code actuel du
dépôt. Elle doit servir de référence avant toute évolution fonctionnelle ou
technique.

---

## 1. Présentation du projet

### Objectif

L'application permet de partager un calendrier de disponibilités consultable par
un visiteur sans compte. Un administrateur peut ensuite se connecter pour
modifier les disponibilités affichées publiquement.

### Deux espaces distincts

- **Espace public** : `/`
  - consultation du calendrier ;
  - lecture seule ;
  - aucune authentification requise ;
  - affichage des informations d'en-tête configurées par l'administrateur.
- **Espace administrateur** : `/admin`, `/admin/login`, `/admin/settings`
  - authentification par Supabase Auth ;
  - modification des créneaux ;
  - modification des paramètres ;
  - gestion des images et du QR code.

### Principe général du calendrier

Le calendrier ne stocke pas tous les créneaux en base. Par défaut, un créneau
ouvré est considéré comme **disponible**. La table `slot_exceptions` contient
uniquement les exceptions à ce comportement : indisponibilités manuelles ou
forçages de disponibilité.

Chaque journée peut afficher trois créneaux :

- `morning` : matin ;
- `afternoon` : après-midi ;
- `evening` : soir, avec une heure de début configurable.

---

## 2. Architecture technique

### Pile utilisée

- **Next.js 14.2.35** avec l'App Router.
- **React 18.3.1**.
- **TypeScript 5.5.2**.
- **Tailwind CSS 3.4.4** pour le style.
- **Supabase** pour :
  - base Postgres ;
  - authentification ;
  - Row Level Security ;
  - Storage ;
  - Realtime.
- **Vercel** pour l'hébergement recommandé et les analytics.

### Dépendances utiles

Les dépendances principales déclarées dans `package.json` sont :

- `next` : framework applicatif ;
- `react` / `react-dom` : rendu UI ;
- `@supabase/ssr` : clients Supabase compatibles navigateur, serveur et
  middleware Next.js ;
- `@supabase/supabase-js` : types et API Supabase ;
- `@vercel/analytics` : analytics Vercel insérées dans le layout racine ;
- `qrcode` : génération client du QR code à partir d'un lien.

### Organisation des principaux dossiers et fichiers

```text
src/
  app/
    layout.tsx                       Layout racine et Vercel Analytics
    page.tsx                         Page publique /
    admin/
      layout.tsx                     Layout de la zone admin
      AdminLayoutClient.tsx          Navigation admin et déconnexion
      login/page.tsx                 Connexion admin
      page.tsx                       Calendrier administrable
      settings/page.tsx              Paramètres de l'application
  components/
    Calendar.tsx                     Calendrier mensuel partagé public/admin
    Header.tsx                       En-tête public configurable
    Legend.tsx                       Légende des couleurs
    BulkEditForm.tsx                 Modification par période
    ImageAssetManager.tsx            Upload/remplacement/suppression d'images
    QrCodeDisplay.tsx                QR code généré ou importé
    ActionFeedback.tsx               Toast de succès/erreur
    WarningBanner.tsx                Bandeau d'avertissement
  lib/
    useAgendaData.ts                 Chargement Supabase + Realtime
    availability.ts                  Calcul de statut des créneaux
    calendarGrid.ts                  Construction de la grille mensuelle
    holidays.ts                      Calcul des jours fériés
    mutations.ts                     Écritures Supabase tables
    storage.ts                       URLs publiques Storage
    storageMutations.ts              Écritures Supabase Storage
    supabaseClient.ts                Client Supabase navigateur
    supabaseServer.ts                Client Supabase serveur
    types.ts                         Types métier
  middleware.ts                      Protection des routes /admin
supabase/
  schema.sql                         Schéma SQL, RLS, Realtime, Storage
```

### Style

Tailwind scanne `src/app` et `src/components`. Les couleurs métier sont :

- `available` : vert ;
- `unavailable` : rouge ;
- `weekend` : gris ;
- `brand` : bleu/gris sombre.

---

## 3. Fonctionnement de l'application publique

### URL

La page publique est disponible sur `/`.

### Chargement initial

La page publique est un composant client. Elle :

1. crée un client Supabase navigateur ;
2. choisit le mois à afficher ;
3. charge les paramètres et les exceptions avec `useAgendaData(year, month)` ;
4. construit les URLs publiques des images configurées ;
5. affiche l'en-tête, le calendrier et la légende.

Le mois initial est :

- septembre 2026 si la date courante est antérieure à septembre 2026 ;
- sinon le mois courant, calculé en UTC.

### Calendrier

Le composant `Calendar` est partagé entre la page publique et l'administration.
Sur la page publique, il est utilisé sans le mode `editable`, donc les créneaux
ne sont pas modifiables.

Le calendrier :

- affiche un mois complet ;
- inclut visuellement les jours hors mois nécessaires pour compléter les
  semaines ;
- commence les semaines le lundi ;
- permet de naviguer vers le mois précédent et le mois suivant ;
- affiche les libellés français des mois et jours de semaine.

### Créneaux

Chaque jour peut afficher trois créneaux :

- `Matin` ;
- `Après-midi` ;
- `Soir (>Xh)` où `X` vient de `settings.evening_start_hour`.

### Week-ends

Le paramètre `settings.show_weekends` contrôle l'affichage des week-ends :

- si activé, les samedis et dimanches sont affichés en gris ;
- si désactivé, ils sont retirés de la grille visible ;
- ils ne deviennent jamais disponibles ou indisponibles comme un jour ouvré.

### Jours fériés

Les jours fériés peuvent être traités comme des jours normaux ou rendus
automatiquement indisponibles selon `settings.holiday_behavior`.

La zone `settings.holiday_zone` peut être :

- `metropole` ;
- `alsace_moselle`.

La zone Alsace-Moselle ajoute le Vendredi saint et le 26 décembre.

### Légende

La légende affiche :

- disponible ;
- indisponible ;
- week-end uniquement si les week-ends sont visibles.

### En-tête public configurable

L'en-tête peut afficher indépendamment :

- un logo ;
- un titre texte ;
- une photo ;
- un QR code.

Si aucun élément actif n'est disponible, l'en-tête ne rend rien.

### Erreurs et rafraîchissement

La page distingue deux situations :

- **erreur de chargement initial** : le calendrier n'est pas affiché, car les
  disponibilités ne peuvent pas être vérifiées ;
- **erreur de rafraîchissement après un premier chargement réussi** : un bandeau
  indique que l'agenda n'est peut-être plus à jour.

Cette distinction évite d'afficher à tort un calendrier entièrement disponible
si la base Supabase n'est pas joignable au démarrage.

---

## 4. Fonctionnement de l'administration

### Routes

- `/admin/login` : page de connexion.
- `/admin` : calendrier administrable.
- `/admin/settings` : paramètres généraux, images et QR code.

### Authentification

La connexion se fait avec Supabase Auth par email et mot de passe via
`signInWithPassword`.

La déconnexion est disponible dans la barre de navigation admin. Elle appelle
`supabase.auth.signOut()`, puis redirige vers `/admin/login`.

### Protection par middleware

Le middleware s'applique aux routes `/admin/:path*`.

Comportement actuel :

- un visiteur non connecté qui demande `/admin` ou `/admin/settings` est redirigé
  vers `/admin/login` ;
- un utilisateur connecté qui visite `/admin/login` est redirigé vers `/admin` ;
- le middleware utilise les cookies de session Supabase via `@supabase/ssr`.

Cette protection protège l'interface, mais la sécurité des écritures dépend aussi
et surtout des policies RLS Supabase.

### `/admin` — calendrier administrable

La page `/admin` charge les mêmes données que la page publique, mais rend le
calendrier en mode `editable`.

Un clic sur un créneau ouvré :

1. calcule le statut actuel du créneau ;
2. enregistre l'exception inverse dans Supabase ;
3. affiche un message de succès ou d'erreur ;
4. relance un `refetch()` après succès.

Les week-ends ne sont pas modifiables.

### Modification individuelle des créneaux

La fonction `toggleSlot` applique la règle suivante :

- si le créneau est actuellement disponible, elle écrit une exception
  `unavailable` ;
- si le créneau est actuellement indisponible, elle écrit une exception
  `available_override`.

L'écriture se fait par `upsert` dans `slot_exceptions`, avec conflit sur
`date,slot`.

### Modification par période

Le formulaire de modification par période permet de choisir :

- une date de début ;
- une date de fin ;
- un ou plusieurs créneaux ;
- une action : bloquer ou rendre disponible.

Les samedis et dimanches sont exclus automatiquement. Si la période ne contient
aucun jour ouvré, l'action échoue avec un message explicite.

Pour chaque jour ouvré et chaque créneau sélectionné, `bulkSetPeriod` prépare une
ligne puis effectue un `upsert` groupé :

- action `block` → type `unavailable` ;
- action `unblock` → type `available_override`.

### `/admin/settings` — paramètres configurables

La page des paramètres permet de modifier :

- affichage des week-ends ;
- zone géographique des jours fériés ;
- comportement des jours fériés ;
- heure de début du créneau soir ;
- activation du logo ;
- activation et texte du titre ;
- activation de la photo ;
- activation du QR code ;
- mode du QR code ;
- contenu du QR code généré (URL ou vCard) ;
- chemins des images stockées.

La sauvegarde met à jour la ligne `settings` avec `id = 1` et actualise
`updated_at`.

### Gestion des images

`ImageAssetManager` gère l'import, le remplacement et la suppression :

- logo ;
- photo ;
- image de QR code importée.

Les inputs HTML acceptent les images PNG et JPEG. Après upload ou suppression,
le champ correspondant de `settings` est mis à jour.

### QR code

Deux modes existent :

- `generated` : le QR code est généré côté client depuis le contenu de
  `settings.qr_link` avec la dépendance `qrcode`. Ce contenu peut être une URL
  ou une vCard ;
- `uploaded` : l'image stockée dans Supabase Storage est affichée.

---

## 5. Logique de disponibilité

La logique de disponibilité est centralisée dans `computeSlotStatus`.

Pour un créneau donné, l'ordre de priorité actuel est strictement :

1. **Week-end**
   - si le jour est un samedi ou dimanche et que les week-ends sont affichés :
     statut `weekend` ;
   - si le jour est un samedi ou dimanche et que les week-ends sont masqués :
     statut `null`, donc le créneau n'est pas rendu ;
   - les exceptions ne priment pas sur les week-ends.
2. **Exception `available_override`**
   - force la disponibilité ;
   - prime notamment sur la règle automatique des jours fériés.
3. **Exception `unavailable`**
   - rend le créneau indisponible.
4. **Jours fériés**
   - si `settings.holiday_behavior` vaut `auto_unavailable` et que la date est un
     jour férié de la zone configurée, le créneau est indisponible.
5. **Disponibilité par défaut**
   - en l'absence de règle précédente, le créneau est disponible.

Point essentiel : `slot_exceptions` contient les exceptions et non l'intégralité
du calendrier. Ajouter une disponibilité normale en base n'est pas nécessaire.

---

## 6. Supabase

### Variables d'environnement

Deux variables sont nécessaires côté local et côté Vercel :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Elles sont utilisées par :

- le client navigateur ;
- le client serveur ;
- le middleware.

La clé anon est exposée côté navigateur. La sécurité doit donc être assurée par
les policies RLS Supabase, pas par le secret de cette clé.

### Schéma SQL

Le fichier `supabase/schema.sql` est le point de référence pour créer la base.
Il configure :

- extension `pgcrypto` ;
- table `settings` ;
- table `slot_exceptions` ;
- index sur les dates d'exceptions ;
- trigger `updated_at` sur `slot_exceptions` ;
- RLS ;
- Realtime ;
- bucket Storage `public-assets` ;
- policies Storage.

### Table `settings`

Table à ligne unique :

- clé primaire `id`, contrainte à `1` ;
- paramètres d'affichage ;
- paramètres des jours fériés ;
- heure du soir ;
- activation et contenu de l'en-tête ;
- chemins des images ;
- mode/lien/image du QR code ;
- `updated_at`.

Le script insère la ligne `id = 1` si elle n'existe pas.

Aucune policy d'insertion ou suppression n'est prévue pour `settings` : la ligne
unique ne doit pas être dupliquée ou supprimée depuis l'application.

### Table `slot_exceptions`

Colonnes principales :

- `id` : UUID ;
- `date` : date au format Postgres ;
- `slot` : `morning`, `afternoon`, `evening` ;
- `type` : `unavailable`, `available_override` ;
- `created_at` ;
- `updated_at`.

Une contrainte `unique (date, slot)` permet les `upsert` utilisés par les
mutations.

### RLS et policies

RLS est activé sur `settings` et `slot_exceptions`.

Principe actuel :

- lecture publique autorisée sur les deux tables ;
- écriture réservée aux utilisateurs authentifiés ;
- `settings` est modifiable par un utilisateur authentifié mais non insérable ni
  supprimable via les policies applicatives ;
- `slot_exceptions` autorise insert/update/delete pour un utilisateur
  authentifié.

### Authentification

L'application utilise Supabase Auth. Le compte administrateur est créé dans
l'interface Supabase, puis utilisé sur `/admin/login`.

Le code ne définit pas de rôles métier supplémentaires. Toute personne
connectée via Supabase Auth est considérée comme administratrice par les policies
actuelles.

### Supabase Storage

Le bucket utilisé est `public-assets`.

Policies actuelles :

- lecture publique des objets de ce bucket ;
- insert/update/delete réservés aux utilisateurs authentifiés.

### Realtime

Le script SQL ajoute les tables `settings` et `slot_exceptions` à la publication
`supabase_realtime`.

Le hook `useAgendaData` s'abonne aux changements sur ces deux tables. À chaque
changement, il recharge les données.

---

## 7. Dates et calendrier

### UTC

Le code manipule les dates du calendrier en UTC :

- création avec `Date.UTC` ;
- lecture avec `getUTC*` ;
- incrément avec `setUTCDate` ;
- sérialisation avec `toISOString().slice(0, 10)`.

Il faut conserver cette cohérence pour éviter les décalages de date liés au
fuseau horaire du navigateur ou du serveur.

### Construction de la grille mensuelle

`buildMonthGrid(year, month)` construit une grille de semaines :

- le mois est indexé de 0 à 11 ;
- la grille commence le lundi ;
- chaque semaine contient sept jours ;
- des jours du mois précédent ou suivant sont inclus pour compléter la grille ;
- chaque jour indique s'il appartient au mois courant avec `inCurrentMonth`.

### Fenêtre de chargement des exceptions

Quand `useAgendaData` reçoit un `year` et un `month`, il charge les exceptions :

- depuis le premier jour du mois précédent ;
- jusqu'au premier jour du mois suivant le mois suivant, borne exclue.

Autrement dit, pour le mois affiché, le hook charge le mois précédent, le mois
courant et le mois suivant. Cela limite le volume de données récupérées tout en
couvrant les jours visibles autour du mois.

Quand aucun mois n'est fourni, le hook charge toutes les exceptions. C'est le cas
sur la page des paramètres.

### Jours fériés

Les jours fériés sont calculés localement par algorithme, sans appel externe.
Le calcul inclut :

- les jours fixes français ;
- le lundi de Pâques ;
- l'Ascension ;
- le lundi de Pentecôte ;
- les spécificités Alsace-Moselle si la zone est sélectionnée.

Un cache mémoire évite de recalculer plusieurs fois le même couple année/zone.

---

## 8. Images et QR code

### Bucket et chemins

Les images sont stockées dans le bucket public `public-assets`.

Les chemins générés par le code sont fixes selon le type d'image :

- `logo.<extension>` ;
- `photo.<extension>` ;
- `qr.<extension>`.

L'extension est extraite du nom du fichier envoyé, avec `png` par défaut si elle
ne peut pas être déterminée.

### Upload et remplacement

L'upload utilise `upsert: true`, ce qui permet de remplacer un objet existant au
même chemin.

Attention : remplacer `logo.png` par `logo.jpg` crée un chemin différent. Le
champ `settings.logo_path` pointera vers le nouveau fichier, mais l'ancien objet
peut rester dans le bucket s'il n'est pas supprimé séparément.

### Suppression

La suppression retire l'objet du bucket puis met à jour le champ correspondant
dans `settings` à `null`.

### Cache et versionnement

Les URLs publiques des images sont construites avec `getPublicAssetUrl`. Quand
un `versionTag` est fourni, l'URL reçoit un paramètre `?v=...`.

Le code utilise `settings.updated_at` comme version. Comme `updateSettings`
actualise `updated_at`, les navigateurs rechargent l'image après remplacement.

### QR code généré ou importé

- Mode `generated` : génération côté client d'une data URL à partir de
  `settings.qr_link`. Ce champ conserve son nom historique, mais il représente
  désormais le contenu à encoder dans le QR code : URL ou vCard.
- Mode `uploaded` : affichage de l'image `settings.qr_image_path` stockée dans
  Supabase Storage.

Si aucune source valide n'est disponible, le composant QR code ne rend rien.

---

## 9. Déploiement

### Principe GitHub + Vercel

Le déploiement prévu repose sur l'intégration GitHub de Vercel :

1. pousser le dépôt sur GitHub ;
2. importer le projet dans Vercel ;
3. configurer les variables d'environnement ;
4. laisser Vercel détecter Next.js et construire l'application ;
5. les futurs pushs déclenchent les déploiements selon la configuration Vercel.

### Variables Vercel

Configurer dans Vercel les mêmes variables qu'en local :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Absence de `vercel.json`

À la date de cette documentation, le dépôt ne contient pas de fichier
`vercel.json`. La configuration Vercel repose donc sur les conventions Next.js et
les réglages de l'interface Vercel.

### Configuration Next.js utile au déploiement

`next.config.js` active `reactStrictMode` et autorise les images distantes depuis
les hôtes `*.supabase.co`.

### Commandes utiles

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

Scripts disponibles :

- `npm run dev` : serveur de développement Next.js ;
- `npm run build` : build de production ;
- `npm run start` : lancement du serveur Next.js après build ;
- `npm run lint` : lint Next.js.

---

## 10. Développement local

### Prérequis

- Node.js 18 ou supérieur recommandé.
- Un projet Supabase configuré avec `supabase/schema.sql`.
- Un utilisateur Supabase Auth confirmé pour accéder à l'administration.

### Installation

```bash
npm install
```

### Variables locales

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Le fichier `.env.local` est ignoré par Git.

### Lancement

```bash
npm run dev
```

Puis ouvrir :

- `http://localhost:3000/` pour la page publique ;
- `http://localhost:3000/admin` pour l'administration.

### Vérification avant push

Avant de pousser une modification, vérifier au minimum :

```bash
npm run lint
npm run build
```

Puis effectuer un test manuel des parcours touchés :

- page publique ;
- connexion admin ;
- modification d'un créneau ;
- modification par période si concernée ;
- paramètres si concernés ;
- comportement Realtime si les données ou abonnements ont changé.

---

## 11. Règles et précautions pour les futures modifications

Cette section liste les invariants techniques à respecter.

### Disponibilité et exceptions

- Ne pas confondre disponibilité par défaut et exceptions.
- Ne pas remplir `slot_exceptions` avec tous les créneaux disponibles.
- Une absence d'exception signifie généralement disponible, sauf week-end ou jour
  férié automatique.
- Préserver la contrainte logique `unique(date, slot)`, car les mutations
  reposent sur des `upsert`.

### Priorité de `computeSlotStatus`

Respecter l'ordre actuel :

1. week-end ;
2. `available_override` ;
3. `unavailable` ;
4. jours fériés automatiques ;
5. disponible par défaut.

Changer cet ordre peut modifier le comportement public et admin, notamment les
exceptions de disponibilité sur jours fériés.

### Week-ends

- Ne pas rendre les week-ends modifiables sans revoir explicitement toute la
  logique métier.
- Les week-ends doivent rester gris lorsqu'ils sont affichés.
- Les actions de masse doivent continuer à ignorer les samedis et dimanches tant
  que cette règle métier existe.

### Dates UTC

- Continuer à utiliser UTC pour les calculs de calendrier.
- Éviter de mélanger `getDate`/`getMonth` avec `getUTCDate`/`getUTCMonth`.
- Convertir les dates persistées au format `YYYY-MM-DD`.

### Supabase et sécurité

- Préserver les RLS lors de toute évolution du schéma.
- Ne pas compter sur la clé anon pour protéger les écritures.
- Vérifier les policies dès qu'une table, un bucket ou un rôle est ajouté.
- Se rappeler qu'actuellement tout utilisateur authentifié est administrateur.

### Table `settings`

- `settings` est une table à ligne unique (`id = 1`).
- Toute évolution multi-calendrier, multi-profil ou multi-tenant devra revoir ce
  modèle.
- Les lectures et écritures applicatives ciblent implicitement cette ligne.

### Realtime

- `useAgendaData` recharge les données à chaque événement Realtime.
- Si les tables changent ou si de nouvelles tables influencent le calendrier,
  adapter les abonnements.
- Si le volume augmente fortement, évaluer une stratégie de mise à jour locale
  plus fine qu'un refetch complet.

### Fenêtre de chargement mensuelle

- Le calendrier mensuel ne charge qu'une fenêtre autour du mois affiché.
- Une vue annuelle, multi-mois ou statistique devra adapter la requête.
- Les jours hors mois visibles sont couverts grâce au chargement du mois
  précédent et du mois suivant.

### Public et admin

Toute modification fonctionnelle doit être vérifiée des deux côtés :

- affichage public ;
- comportement admin ;
- cohérence après rafraîchissement ;
- cohérence Realtime ;
- cohérence des messages d'erreur.

### Images

- Les chemins d'images sont fixes par type mais dépendent de l'extension.
- Un changement d'extension peut laisser un ancien fichier inutilisé dans
  Storage.
- Conserver le mécanisme de versionnement par `settings.updated_at` si les images
  continuent à être remplacées au même chemin.

---

## 12. État actuel du projet

### Fonctionnalités présentes

- Page publique de consultation du calendrier.
- Calendrier mensuel avec navigation précédent/suivant.
- Trois créneaux par jour : matin, après-midi, soir.
- Heure de début du soir configurable.
- Affichage/masquage des week-ends.
- Gestion algorithmique des jours fériés français.
- Zone Alsace-Moselle.
- Règle optionnelle rendant les jours fériés automatiquement indisponibles.
- Exception `available_override` permettant de forcer une disponibilité.
- Connexion admin par Supabase Auth.
- Protection middleware des routes `/admin`.
- Modification individuelle des créneaux.
- Modification par période.
- Paramètres d'affichage.
- En-tête public configurable.
- Upload, remplacement et suppression de logo, photo et QR code importé.
- QR code généré depuis un lien.
- Supabase Realtime sur `settings` et `slot_exceptions`.
- Vercel Analytics dans le layout racine.

### Limites techniques connues

- Aucun script de test automatisé n'est déclaré dans `package.json`.
- Le README fournit une procédure de tests manuels ; elle reste la méthode de
  validation fonctionnelle principale actuellement documentée.
- L'application est pensée pour un calendrier unique.
- La table `settings` est volontairement à ligne unique.
- Il n'existe pas de rôles applicatifs fins : tout utilisateur Supabase Auth
  authentifié peut écrire selon les policies actuelles.
- Les mises à jour Realtime déclenchent un refetch complet des données chargées.
- Les composants principaux sont majoritairement des client components.

---

## 13. Procédure de test manuel

Après déploiement ou en local avec `npm run dev`, vérifier :

1. **Page publique** : le calendrier s'affiche à partir de septembre 2026 ou du
   mois courant si postérieur.
2. **Navigation** : les boutons précédent/suivant changent de mois.
3. **Connexion admin** : `/admin` redirige vers `/admin/login` si non connecté.
4. **Bascule individuelle** : un créneau ouvré peut passer disponible ↔
   indisponible.
5. **Public après modification** : la modification apparaît sur la page publique.
6. **Realtime** : une modification admin se répercute sans rechargement manuel
   dans un autre onglet déjà ouvert.
7. **Modification par période** : seuls les créneaux choisis et jours ouvrés de
   la période sont modifiés.
8. **Heure du soir** : le libellé `Soir (>Xh)` suit le paramètre configuré.
9. **Week-ends** : affichage/masquage et couleur grise.
10. **Jours fériés** : règle normale ou `auto_unavailable` selon le paramètre.
11. **Alsace-Moselle** : présence du Vendredi saint et du 26 décembre.
12. **Exception sur jour férié** : `available_override` prime sur
    `auto_unavailable`.
13. **En-tête** : logo, titre, photo et QR code activables séparément.
14. **Images** : import, remplacement et suppression.
15. **QR code** : mode généré depuis une URL ou une vCard, et mode importé.
16. **Erreur Supabase simulée** : la page affiche un avertissement plutôt qu'un
    calendrier faussement disponible.
17. **Responsive** : le calendrier reste lisible, avec défilement horizontal si
    nécessaire.

---

## 14. Historique et décisions importantes identifiables

Les décisions suivantes sont vérifiables dans le code ou le schéma actuel :

- **Calendrier par exceptions** : `slot_exceptions` stocke seulement les écarts à
  la disponibilité par défaut.
- **Paramètres globaux centralisés** : `settings` est une table à ligne unique.
- **Sécurité par RLS** : lecture publique et écritures réservées aux utilisateurs
  authentifiés.
- **Administration simple** : pas de rôles applicatifs supplémentaires au-dessus
  de Supabase Auth.
- **Realtime simple** : les changements sur `settings` et `slot_exceptions`
  provoquent un rechargement des données côté client.
- **Dates en UTC** : les calculs calendrier utilisent les méthodes UTC.
- **Jours fériés sans API externe** : calcul local algorithmique.
- **Images publiques** : assets dans un bucket Supabase public, écritures
  réservées aux utilisateurs authentifiés.
- **Déploiement sans configuration Vercel dédiée** : pas de `vercel.json` dans le
  dépôt au moment de cette documentation.
