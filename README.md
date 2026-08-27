# Agenda de disponibilités

Application web permettant de publier un calendrier de disponibilités consultable
publiquement (lecture seule), avec une administration protégée pour gérer les
créneaux et les paramètres.

- **Frontend** : Next.js 14 + React + Tailwind CSS
- **Backend** : Supabase (base de données Postgres, authentification, stockage, temps réel)
- **Hébergement conseillé** : Vercel (offre gratuite)

---

## 1. Créer le projet Supabase

1. Va sur https://supabase.com et crée un compte (gratuit).
2. Clique sur **New project**, choisis un nom (ex : `agenda-dispo`), un mot de
   passe pour la base (à conserver précieusement) et une région proche de toi
   (ex : `eu-central-1` / Francfort).
3. Attends la fin de la création du projet (1 à 2 minutes).

### 1.1 Exécuter le schéma SQL

1. Dans le menu de gauche, ouvre **SQL Editor**.
2. Clique sur **New query**.
3. Colle l'intégralité du contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql).
4. Clique sur **Run**. Tu dois voir un message de succès.

Cela crée :
- la table `settings` (un seul enregistrement, les paramètres de l'application) ;
- la table `slot_exceptions` (les indisponibilités manuelles et les exceptions
  de disponibilité) ;
- les règles de sécurité (Row Level Security) : lecture publique, écriture
  réservée aux utilisateurs authentifiés ;
- l'activation du temps réel sur ces deux tables ;
- le bucket de stockage public `public-assets` (logo / photo / QR code) avec
  ses propres règles de sécurité.

> Si la création du bucket échoue (rare, selon les droits du projet), crée-le
> manuellement : **Storage** → **New bucket** → nom `public-assets` → coche
> **Public bucket** → **Save**. Réexécute ensuite uniquement les lignes du
> script concernant `storage.objects` (policies).

### 1.2 Récupérer les clés d'API

1. Va dans **Project Settings** (icône d'engrenage) → **API**.
2. Note :
   - **Project URL** (ex : `https://xxxxxxxx.supabase.co`)
   - **anon public key** (une longue chaîne commençant par `eyJ...`)

Ces deux valeurs sont sans danger à utiliser côté navigateur : la sécurité
réelle est assurée par les règles RLS configurées à l'étape précédente, pas
par le secret de cette clé.

---

## 2. Créer le compte administrateur

1. Dans Supabase, va dans **Authentication** → **Users**.
2. Clique sur **Add user** → **Create new user**.
3. Renseigne ton adresse mail et un mot de passe. Décoche/ignore l'envoi
   d'email de confirmation si l'option apparaît, ou confirme manuellement
   l'utilisateur (bouton disponible dans la liste après création) — il doit
   apparaître comme confirmé pour pouvoir se connecter.

C'est cet email/mot de passe qui te servira à te connecter sur `/admin`.

---

## 3. Configuration du projet en local

1. Installe [Node.js](https://nodejs.org) (version 18 ou supérieure) si ce
   n'est pas déjà fait.
2. Ouvre un terminal dans le dossier du projet et installe les dépendances :

   ```bash
   npm install
   ```

3. Crée un fichier `.env.local` à la racine du projet (copie de `.env.example`) :

   ```bash
   cp .env.example .env.local
   ```

4. Renseigne dans `.env.local` les deux valeurs récupérées à l'étape 1.2 :

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. Lance l'application en local pour vérifier que tout fonctionne :

   ```bash
   npm run dev
   ```

   Ouvre http://localhost:3000 (page publique) et
   http://localhost:3000/admin (administration, te redirige vers la page de
   connexion).

---

## 4. Déploiement gratuit sur Vercel

1. Crée un compte sur https://vercel.com (tu peux te connecter avec GitHub).
2. Mets le code du projet sur un dépôt GitHub :
   - Crée un nouveau dépôt sur https://github.com/new (peut être privé).
   - Depuis le dossier du projet :
     ```bash
     git init
     git add .
     git commit -m "Première version"
     git branch -M main
     git remote add origin <URL_DE_TON_DEPOT>
     git push -u origin main
     ```
3. Sur Vercel, clique sur **Add New** → **Project**, puis sélectionne ton
   dépôt GitHub.
4. Dans la section **Environment Variables**, ajoute les deux mêmes variables
   que dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique sur **Deploy**. Après 1 à 2 minutes, Vercel te donne une URL du type
   `https://agenda-dispo-xxxx.vercel.app`.
6. (Optionnel) Dans **Project Settings** → **Domains**, tu peux choisir un
   sous-domaine `*.vercel.app` plus lisible, ou brancher un nom de domaine
   personnel si tu en as un.

C'est ce lien (`https://.../` pour la page publique) que tu partages avec tes
prospects par mail. La page `/admin` de ce même lien est ton espace de gestion.

---

## 5. Procédure de test

Après déploiement (ou en local avec `npm run dev`), vérifie dans l'ordre :

1. **Page publique** : le calendrier s'affiche à partir de septembre 2026
   (ou du mois courant si postérieur), avec tous les créneaux verts par défaut.
2. **Navigation** : les boutons mois précédent/suivant fonctionnent, y
   compris au-delà d'août 2027.
3. **Connexion admin** : `/admin` redirige vers `/admin/login` si non
   connecté ; connexion avec le compte créé à l'étape 2 fonctionne et redirige
   vers `/admin`.
4. **Bascule individuelle** : dans `/admin`, cliquer sur un créneau vert le
   passe en rouge avec confirmation « Modification enregistrée. », et
   inversement.
5. **Vérification publique immédiate** : ouvrir la page publique dans un
   autre onglet (sans être connecté) et constater que la modification
   apparaît automatiquement, sans recharger la page (temps réel).
6. **Modification par période** : bloquer une période de plusieurs jours
   avec certains créneaux cochés, vérifier que seuls ces créneaux sur ces
   jours (hors week-end) passent en rouge ; tester ensuite l'action inverse.
7. **Heure du soir** : dans `/admin/settings`, changer l'heure de début du
   soir (ex : 17 → 18) et vérifier que le libellé « Soir (>18h) » se met à
   jour partout.
8. **Week-ends** : basculer l'option d'affichage des week-ends et vérifier
   qu'ils apparaissent/disparaissent, toujours en gris quand affichés.
9. **Jours fériés** : activer « Rendre automatiquement les jours fériés
   indisponibles » et vérifier qu'un jour férié (ex : 1er novembre 2026)
   passe en rouge sans qu'aucune indisponibilité manuelle n'ait été créée.
10. **Alsace-Moselle** : changer la zone géographique et vérifier
    l'apparition du Vendredi saint et du 26 décembre comme fériés.
11. **Exception sur jour férié** : avec la règle automatique activée, cliquer
    sur le créneau d'un jour férié pour le repasser en vert ; vérifier que la
    disponibilité est bien forcée malgré la règle automatique.
12. **En-tête** : activer/désactiver logo, titre, photo, QR code
    indépendamment ; importer puis supprimer chaque image ; générer un QR
    code depuis un lien.
13. **Sécurité** : essayer d'appeler l'API Supabase en écriture sans être
    connecté (par exemple via les outils de développement du navigateur) —
    la requête doit être rejetée par les règles RLS.
14. **Panne simulée** : couper temporairement l'accès réseau ou renseigner
    une mauvaise URL Supabase — la page publique doit afficher le message
    d'avertissement (« Impossible de mettre à jour l'agenda… ») et non un
    calendrier entièrement vert.
15. **Responsive** : tester sur un smartphone (ou le mode responsive du
    navigateur) — le calendrier doit rester lisible, quitte à défiler
    horizontalement.

---

## 6. Notes d'évolutivité (hors périmètre V1, pour information)

L'architecture (une table d'exceptions distincte des paramètres, un seul
compte admin, un seul calendrier) permettrait, sans tout reconstruire :
- plusieurs calendriers (ajout d'une colonne `calendar_id`) ;
- plusieurs administrateurs (déjà géré nativement par Supabase Auth) ;
- une prise de rendez-vous en ligne (ajout d'une table `bookings`).

Aucune de ces fonctionnalités n'est développée dans cette version.
