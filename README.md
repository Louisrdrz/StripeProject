# AI Image Generator - Application de génération d'images avec IA

Application complète de génération d'images utilisant Replicate, Supabase (authentification + stockage) et Stripe (abonnements).

## 🚀 Technologies

- **Next.js 14** avec TypeScript et App Router
- **Supabase** pour l'authentification, la base de données et le stockage
- **Replicate** pour la génération d'images IA
- **Stripe** pour les abonnements mensuels
- **Tailwind CSS** pour le style

## 📋 Prérequis

1. **Node.js** installé (version 18+)
2. **Compte Supabase** créé
3. **Compte Replicate** créé
4. **Compte Stripe** créé

## 🛠️ Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration Supabase

#### a. Créer les buckets de stockage

1. Aller sur [Supabase](https://supabase.com/) → votre projet → **Storage**
2. Créer deux buckets :
   - `input-images` (public)
   - `output-images` (public)
3. Pour chaque bucket : **Policies** → **New Policy** → **Allow public read access**

#### b. Créer les tables

Aller dans **SQL Editor** et exécuter ces commandes :

```sql
-- Table projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  input_image_url TEXT NOT NULL,
  output_image_url TEXT,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'processing'
);

-- Index pour améliorer les performances
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Activer Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies pour projects
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Table subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  quota_limit INTEGER DEFAULT 50,
  quota_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index pour subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- RLS pour subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);
```

#### c. Récupérer les clés Supabase

Dans Supabase → **Settings** → **API** :
- **Project URL** : `https://xxxxx.supabase.co`
- **anon public key** : `eyJhbGc...`
- **service_role key** : `eyJhbGc...` (⚠️ secret)

### 3. Configuration Replicate

1. Créer un compte sur [Replicate](https://replicate.com/)
2. **Account Settings** → **API Tokens** → créer un token : `r8_xxxxx...`
3. Choisir un modèle (par exemple [google/nano-banana](https://replicate.com/google/nano-banana))
4. Copier l'identifiant complet avec la version (ex: `google/nano-banana:abc123...`)

### 4. Configuration Stripe

1. Créer un compte sur [Stripe](https://stripe.com/)
2. **Developers** → **API keys** (mode test) :
   - **Publishable key** : `pk_test_xxxxx...`
   - **Secret key** : `sk_test_xxxxx...`

3. Créer les produits :
   - **Products** → **Add product**
   - **Plan Basic** : 9€/mois (50 générations) → copier le Price ID
   - **Plan Pro** : 19€/mois (200 générations) → copier le Price ID

### 5. Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Replicate
REPLICATE_API_TOKEN=r8_xxxxx...
REPLICATE_MODEL_ID=google/nano-banana:abc123def456...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx...
STRIPE_SECRET_KEY=sk_test_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
STRIPE_PRICE_ID_BASIC=price_xxxxx...
STRIPE_PRICE_ID_PRO=price_yyyyy...

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

## 🚀 Lancement en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📦 Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-username/votre-repo.git
git push -u origin main
```

### 2. Déployer sur Vercel

1. Aller sur [Vercel](https://vercel.com/)
2. **New Project** → Importer votre dépôt GitHub
3. Ajouter toutes les variables d'environnement (copier depuis `.env.local`)
4. Changer `NEXT_PUBLIC_URL` vers `https://votre-site.vercel.app`
5. **Deploy**

### 3. Configurer le webhook Stripe

Une fois déployé :

1. Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. URL : `https://votre-site.vercel.app/api/webhooks/stripe`
3. Événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier le **Signing secret** : `whsec_xxxxx...`
5. Vercel → **Environment Variables** → Ajouter `STRIPE_WEBHOOK_SECRET`
6. Redéployer

## 🧪 Tester l'application

### Carte de test Stripe

- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future (ex: 12/34)
- CVC : n'importe quels 3 chiffres (ex: 123)

### Parcours de test

1. S'inscrire → créer un compte
2. S'abonner → choisir un plan
3. Dashboard → uploader une image + prompt
4. Générer → attendre le résultat
5. Voir la galerie → vérifier le projet
6. Gérer l'abonnement → accéder au portal Stripe
7. Supprimer un projet

## 📁 Structure du projet

```
├── app/
│   ├── api/
│   │   ├── generate/route.ts           # Génération d'images
│   │   ├── delete/route.ts             # Suppression de projets
│   │   ├── create-subscription-checkout/route.ts
│   │   ├── create-portal-session/route.ts
│   │   └── webhooks/stripe/route.ts    # Webhooks Stripe
│   ├── dashboard/page.tsx              # Page principale
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── pricing/page.tsx
│   ├── page.tsx                        # Landing page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AuthForm.tsx
│   ├── Header.tsx
│   ├── PricingCard.tsx
│   ├── SubscriptionStatus.tsx
│   └── ProjectGallery.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── middleware.ts                        # Protection des routes
├── .env.local                          # Variables d'environnement
└── package.json
```

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activée sur toutes les tables
- ✅ Authentification vérifiée sur toutes les routes protégées
- ✅ Webhooks Stripe avec vérification de signature
- ✅ Ownership vérifié avant toute opération
- ✅ Variables sensibles côté serveur uniquement

## 💰 Passer en production (Stripe Live)

1. Stripe → **Activate account** (remplir les informations légales)
2. Mode **Live** → récupérer les nouvelles clés
3. Recréer les produits en mode Live
4. Reconfigurer le webhook en mode Live
5. Mettre à jour les variables d'environnement sur Vercel
6. Redéployer

## 📝 Licence

MIT

