# 🔧 Configuration de votre .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# ✅ Supabase (DÉJÀ FOURNI)
NEXT_PUBLIC_SUPABASE_URL=

# ⚠️ À RÉCUPÉRER : Service Role Key
# Aller sur https://supabase.com → Projet → Settings → API → service_role key (secret)
SUPABASE_SERVICE_KEY=VOTRE_SERVICE_ROLE_KEY_ICI

# ✅ Replicate (DÉJÀ FOURNI)
REPLICATE_API_TOKEN=

# ⚠️ À COMPLÉTER : ID du modèle Replicate avec version
# Aller sur https://replicate.com/google/nano-banana
# Dans "Run with API" → onglet Node.js
# Copier l'ID complet après "replicate.run(" (ex: "google/nano-banana:abc123...")
REPLICATE_MODEL_ID=google/nano-banana

# ⚠️ Stripe - À CRÉER
# 1. Créer un compte sur https://stripe.com
# 2. Aller dans Developers → API keys (mode TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI

# 3. Créer les produits dans Stripe → Products :
#    - Plan Basic : 9€/mois, 50 générations → copier le Price ID
#    - Plan Pro : 19€/mois, 200 générations → copier le Price ID
# ⚠️ IMPORTANT : Ces variables doivent avoir NEXT_PUBLIC_ pour être accessibles côté client
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_VOTRE_BASIC_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_VOTRE_PRO_ID

# 4. Webhook secret (à configurer APRÈS le déploiement)
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET

# ✅ App
NEXT_PUBLIC_URL=http://localhost:3000
```

---

# 📝 ÉTAPES À SUIVRE MAINTENANT

## 1️⃣ Récupérer la Service Role Key de Supabase (URGENT)

1. Aller sur https://supabase.com
2. Ouvrir votre projet
3. **Settings** → **API**
4. Dans la section "Project API keys", copier la clé **`service_role`** (⚠️ secret, ne pas partager)
5. Remplacer `VOTRE_SERVICE_ROLE_KEY_ICI` dans `.env.local`

## 2️⃣ Créer les buckets Supabase Storage

1. Dans Supabase → **Storage**
2. Cliquer **New bucket**
   - Nom : `input-images`
   - Public : **OUI** ✅
3. Répéter pour créer :
   - Nom : `output-images`
   - Public : **OUI** ✅

### Rendre les buckets publics :
Pour chaque bucket :
- Cliquer sur le bucket → **Policies**
- Cliquer **New Policy**
- Choisir **Allow public read access**
- Créer la policy

## 3️⃣ Créer les tables dans Supabase

1. Aller dans **SQL Editor**
2. Copier-coller ce SQL et **RUN** :

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

-- Index
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

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

-- Index
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);
```

## 4️⃣ Configurer Replicate (ID du modèle)

1. Aller sur https://replicate.com/google/nano-banana
2. Scroller jusqu'à **"Run with API"**
3. Cliquer sur l'onglet **Node.js**
4. Trouver la ligne qui ressemble à :
   ```js
   const output = await replicate.run("google/nano-banana:abc123def456...", {...})
   ```
5. Copier TOUT ce qui est entre guillemets (y compris après les `:`)
6. Remplacer dans `.env.local` :
   ```
   REPLICATE_MODEL_ID=google/nano-banana:LA_VERSION_COMPLETE_ICI
   ```

## 5️⃣ Créer un compte Stripe

1. Aller sur https://stripe.com
2. Créer un compte (RESTER EN MODE TEST pour l'instant)
3. Aller dans **Developers** → **API keys**
4. Copier :
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)
5. Les mettre dans `.env.local`

## 6️⃣ Créer les produits Stripe

1. Dans Stripe → **Products** → **Add product**
2. **Premier produit** :
   - Name : `Plan Basic`
   - Description : `50 générations d'images par mois`
   - Pricing model : **Recurring**
   - Price : `9` EUR
   - Billing period : **Monthly**
   - **Save product**
   - ⚠️ Copier le **Price ID** (commence par `price_`) → le mettre dans `NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC`

3. **Deuxième produit** :
   - Name : `Plan Pro`
   - Description : `200 générations d'images par mois`
   - Pricing model : **Recurring**
   - Price : `19` EUR
   - Billing period : **Monthly**
   - **Save product**
   - ⚠️ Copier le **Price ID** → le mettre dans `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`

## 7️⃣ Laisser le webhook vide pour l'instant

Le `STRIPE_WEBHOOK_SECRET` sera configuré **APRÈS le déploiement** sur Vercel.
Pour l'instant, vous pouvez le laisser vide ou mettre une valeur temporaire :
```
STRIPE_WEBHOOK_SECRET=temp
```

---

# 🚀 Prochaines étapes

Une fois le `.env.local` complet :

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir http://localhost:3000

---

# ✅ Checklist de configuration

- [ ] Service Role Key de Supabase récupérée
- [ ] Buckets `input-images` et `output-images` créés et publics
- [ ] Tables SQL créées (projects + subscriptions)
- [ ] ID complet du modèle Replicate récupéré
- [ ] Compte Stripe créé
- [ ] Clés API Stripe récupérées (pk_test et sk_test)
- [ ] Plan Basic créé dans Stripe (Price ID récupéré)
- [ ] Plan Pro créé dans Stripe (Price ID récupéré)
- [ ] Fichier `.env.local` complet
- [ ] `npm install` exécuté
- [ ] `npm run dev` fonctionne

---

# 🆘 Besoin d'aide ?

Si vous avez des erreurs ou des questions, partagez-les et je vous aiderai !

