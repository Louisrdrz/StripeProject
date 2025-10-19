# ✅ Étapes restantes pour finaliser Stripe (Option B)

## 📋 Récapitulatif

Votre code est **100% prêt** ! Tout le système d'abonnement est implémenté.  
Il ne vous reste plus qu'à **configurer Stripe et déployer**.

---

## 🚀 À FAIRE IMMÉDIATEMENT

### 1️⃣ Créer le fichier .env.local (5 min)

**À la racine de votre projet**, créez un fichier nommé `.env.local` et copiez-y ceci :

```env
# ========================================
# SUPABASE CONFIGURATION
# ========================================
# TODO: Remplir avec vos vraies valeurs Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# ========================================
# REPLICATE CONFIGURATION
# ========================================
# TODO: Remplir avec votre token Replicate
REPLICATE_API_TOKEN=r8_...
REPLICATE_MODEL_ID=google/nano-banana

# ========================================
# STRIPE CONFIGURATION
# ========================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_VOTRE_ID_ICI
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_VOTRE_ID_ICI
STRIPE_WEBHOOK_SECRET=

# ========================================
# APPLICATION
# ========================================
NEXT_PUBLIC_URL=http://localhost:3000
```

---

### 2️⃣ Créer/Récupérer vos clés Stripe (5 min)

1. **Créer un compte Stripe** (si pas déjà fait) :
   - Aller sur https://stripe.com
   - Créer un compte
   - ⚠️ **RESTER EN MODE TEST** (ne pas activer le compte)

2. **Récupérer les clés API** :
   - Aller sur https://dashboard.stripe.com/test/apikeys
   - Copier la **Publishable key** (commence par `pk_test_...`)
   - Copier la **Secret key** (cliquer "Reveal", commence par `sk_test_...`)
   - Les mettre dans `.env.local`

---

### 3️⃣ Créer les produits Stripe (10 min)

#### **Produit 1 : Plan Basic**

1. Aller sur https://dashboard.stripe.com/test/products
2. Cliquer **+ Add product**
3. Remplir :
   ```
   Name: Plan Basic
   Description: 50 générations d'images IA par mois
   ```
4. Section **Pricing** :
   ```
   Pricing model: Recurring
   Price: 9.00
   Currency: EUR
   Billing period: Monthly
   ```
5. Cliquer **Add product**
6. **Dans la page du produit**, section **Pricing** :
   - Cliquer sur le prix pour voir ses détails
   - **Copier le Price ID** (commence par `price_...`)
   - Le mettre dans `.env.local` → `NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC`

#### **Produit 2 : Plan Pro**

1. Cliquer **+ Add product**
2. Remplir :
   ```
   Name: Plan Pro
   Description: 200 générations d'images IA par mois
   ```
3. Section **Pricing** :
   ```
   Pricing model: Recurring
   Price: 19.00
   Currency: EUR
   Billing period: Monthly
   ```
4. Cliquer **Add product**
5. **Copier le Price ID** et le mettre dans `.env.local` → `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`

---

### 4️⃣ Redémarrer le serveur (1 min)

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis relancer :
npm run dev
```

---

### 5️⃣ Tester en local (5 min)

1. Aller sur http://localhost:3000/pricing
2. Cliquer **"S'abonner maintenant"** sur un plan
3. Vous devriez être redirigé vers la page Stripe Checkout ✅
4. Utiliser une carte de test : `4242 4242 4242 4242`
   - Date : 12/34
   - CVC : 123
   - Code postal : n'importe lequel

⚠️ **IMPORTANT** : En local, le webhook NE FONCTIONNERA PAS (l'abonnement n'apparaîtra pas dans Supabase). C'est normal ! Pour que les webhooks fonctionnent, il faut déployer sur Vercel (étape suivante).

---

## 🌐 DÉPLOIEMENT SUR VERCEL

### 6️⃣ Push sur GitHub (2 min)

```bash
git add .
git commit -m "Add Stripe subscription system"
git push
```

---

### 7️⃣ Déployer sur Vercel (10 min)

1. Aller sur https://vercel.com
2. Se connecter avec GitHub
3. Importer votre projet GitHub
4. **NE PAS DÉPLOYER TOUT DE SUITE** !
5. Aller dans **Settings** → **Environment Variables**
6. Ajouter **TOUTES** les variables de votre `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   SUPABASE_SERVICE_KEY = eyJhbGc...
   REPLICATE_API_TOKEN = r8_...
   REPLICATE_MODEL_ID = google/nano-banana
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
   STRIPE_SECRET_KEY = sk_test_...
   NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC = price_...
   NEXT_PUBLIC_STRIPE_PRICE_ID_PRO = price_...
   NEXT_PUBLIC_URL = https://votre-projet.vercel.app
   STRIPE_WEBHOOK_SECRET = (laisser VIDE pour l'instant)
   ```
7. Cliquer **Deploy**
8. Attendre le déploiement (2-3 minutes)
9. **Noter l'URL de votre site** : `https://votre-projet.vercel.app`

---

### 8️⃣ Configurer le webhook Stripe (5 min)

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer **+ Add endpoint**
3. **Endpoint URL** : `https://votre-projet.vercel.app/api/webhooks/stripe`
4. Cliquer **Select events**
5. Cocher :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Cliquer **Add endpoint**
7. **Copier le Signing secret** : `whsec_xxxxx...`

---

### 9️⃣ Ajouter le webhook secret dans Vercel (2 min)

1. Retourner sur Vercel → votre projet
2. **Settings** → **Environment Variables**
3. Trouver `STRIPE_WEBHOOK_SECRET` (ou l'ajouter si elle n'existe pas)
4. Coller le `whsec_xxxxx...` copié depuis Stripe
5. Cliquer **Save**
6. Aller dans **Deployments**
7. Sur le dernier déploiement, cliquer **...** → **Redeploy**
8. Attendre le redéploiement (1-2 minutes)

---

### 🔟 Tester en production (5 min)

1. Aller sur `https://votre-projet.vercel.app/pricing`
2. Se connecter avec votre compte
3. Cliquer **"S'abonner"** sur le Plan Basic
4. Payer avec la carte test : `4242 4242 4242 4242`
5. Vous revenez sur `/dashboard`
6. **Vous devriez voir** : "Plan Basic - 0/50 générations restantes" ✅

**Vérifications** :
- ✅ Dans Stripe → Subscriptions → Vous voyez l'abonnement actif
- ✅ Dans Supabase → Table `subscriptions` → Une nouvelle ligne apparaît
- ✅ Dans Stripe → Webhooks → Recent deliveries → Icônes vertes (200 OK)

---

## 🐛 SI LE WEBHOOK NE FONCTIONNE PAS

### Vérifier les logs Vercel

1. Vercel → votre projet → **Logs**
2. Filtrer par `/api/webhooks/stripe`
3. Chercher les erreurs

### Erreurs courantes

#### ❌ "Webhook signature verification failed"
→ Vérifier que `STRIPE_WEBHOOK_SECRET` est bien configuré dans Vercel  
→ Redéployer après avoir ajouté la variable

#### ❌ "user_id is undefined"
→ Votre code est correct, refaire un nouveau test de paiement

#### ❌ "duplicate key value"
→ Supprimer les anciennes lignes de test dans Supabase → Table `subscriptions`

---

## 📚 Documentation complète

Votre projet contient déjà des guides détaillés :
- `STRIPE_SETUP.md` - Configuration Stripe
- `WEBHOOK_CHECK.md` - Vérification des webhooks
- `WEBHOOK_DEBUG.md` - Debugging webhooks

---

## ✅ CHECKLIST FINALE

- [ ] Fichier `.env.local` créé avec toutes les variables
- [ ] Compte Stripe créé (mode test)
- [ ] Clés API Stripe récupérées
- [ ] Produit "Plan Basic" créé dans Stripe
- [ ] Produit "Plan Pro" créé dans Stripe
- [ ] Price IDs copiés dans `.env.local`
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test local réussi (redirection vers Stripe Checkout)
- [ ] Code pushé sur GitHub
- [ ] Projet déployé sur Vercel
- [ ] Variables d'environnement ajoutées sur Vercel
- [ ] Webhook créé dans Stripe
- [ ] Webhook secret ajouté dans Vercel
- [ ] Vercel redéployé
- [ ] Test en production réussi
- [ ] Abonnement visible dans le dashboard

---

## 🎉 RÉSULTAT FINAL

Quand tout est configuré, votre SaaS sera **100% fonctionnel** :

- ✅ Page pricing avec 2 plans
- ✅ Paiement sécurisé via Stripe
- ✅ Abonnement créé automatiquement via webhook
- ✅ Dashboard avec quota en temps réel
- ✅ Génération d'images avec décompte du quota
- ✅ Portail client Stripe pour gérer l'abonnement
- ✅ Renouvellement automatique chaque mois avec reset du quota

**Temps estimé total : 45-60 minutes**

Bon courage ! 🚀

