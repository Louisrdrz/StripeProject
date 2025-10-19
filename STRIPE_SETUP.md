# 💳 Configuration Stripe - Guide Complet

## ❌ Erreur actuelle
```
Error: No such price: 'price_basic'
```

Cette erreur signifie que votre application utilise des IDs de prix fictifs qui n'existent pas dans Stripe.

---

## 🎯 Solution : Créer les vrais prix Stripe

### Étape 1 : Créer un compte Stripe (si pas déjà fait)

1. Allez sur **https://stripe.com**
2. Créez un compte
3. ⚠️ **Restez en MODE TEST** (pour développement)

### Étape 2 : Récupérer vos clés API

1. Dans Stripe Dashboard → **Developers** → **API keys**
2. Copiez ces deux clés :
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (cliquez sur "Reveal" puis copiez, commence par `sk_test_...`)

### Étape 3 : Créer les produits et prix

#### **Produit 1 : Plan Basic**

1. Dans Stripe Dashboard → **Products** → **+ Add product**
2. Remplissez :
   - **Name** : `Plan Basic`
   - **Description** : `50 générations d'images IA par mois`
3. Section **Pricing** :
   - **Pricing model** : Sélectionnez **Recurring** ✅
   - **Price** : `9.00`
   - **Currency** : `EUR` (ou votre monnaie)
   - **Billing period** : **Monthly**
4. Cliquez sur **Add product**
5. ⚠️ **IMPORTANT** : Sur la page du produit, dans la section **Pricing**, vous verrez votre prix créé
6. **Cliquez sur le prix** pour voir ses détails
7. **Copiez le Price ID** (commence par `price_...` exemple : `price_1AbCdEfGhIjKlMnO`)

#### **Produit 2 : Plan Pro**

1. **Products** → **+ Add product**
2. Remplissez :
   - **Name** : `Plan Pro`
   - **Description** : `200 générations d'images IA par mois`
3. Section **Pricing** :
   - **Pricing model** : **Recurring** ✅
   - **Price** : `19.00`
   - **Currency** : `EUR`
   - **Billing period** : **Monthly**
4. Cliquez sur **Add product**
5. **Copiez le Price ID** du prix créé

---

## 📝 Configuration du fichier .env.local

### Créer le fichier .env.local

À la **racine de votre projet**, créez un fichier nommé `.env.local` (s'il n'existe pas déjà) et ajoutez :

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI

# Stripe Price IDs
# ⚠️ IMPORTANT : Remplacez par vos VRAIS Price IDs de Stripe
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_VOTRE_PRICE_ID_BASIC_ICI
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_VOTRE_PRICE_ID_PRO_ICI

# Webhook (laisser vide pour l'instant, à configurer après déploiement)
STRIPE_WEBHOOK_SECRET=
```

### ⚠️ Point important

Les variables avec `NEXT_PUBLIC_` sont accessibles côté client (navigateur). C'est normal et sécurisé pour :
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : clé publique, faite pour être exposée
- `NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC` : juste un ID de prix, pas sensible
- `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` : juste un ID de prix, pas sensible

La clé secrète `STRIPE_SECRET_KEY` n'a PAS de préfixe `NEXT_PUBLIC_` donc elle reste côté serveur uniquement.

---

## 🔄 Redémarrer le serveur

Après avoir modifié `.env.local`, vous DEVEZ redémarrer votre serveur Next.js :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer :
npm run dev
```

---

## ✅ Vérification

Après configuration :

1. Redémarrez le serveur : `npm run dev`
2. Allez sur http://localhost:3000/pricing
3. Cliquez sur **"S'abonner maintenant"** pour le plan Basic
4. Vous devriez être redirigé vers la page de paiement Stripe ✅

### 🧪 Tester le paiement (mode TEST)

Pour tester en mode TEST, utilisez ces numéros de carte :

- **Carte qui réussit** : `4242 4242 4242 4242`
- Date d'expiration : n'importe quelle date future (ex: 12/34)
- CVC : n'importe quels 3 chiffres (ex: 123)
- Code postal : n'importe lequel

---

## 🎨 Exemple complet de .env.local

```env
# Supabase (si vous avez déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Replicate (si vous avez déjà configuré)
REPLICATE_API_TOKEN=r8_...
REPLICATE_MODEL_ID=google/nano-banana:abc123...

# Stripe ⭐ NOUVEAU
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnO...
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnO...
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_1AbCdEfGhIjKlMnO...
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_1PqRsTuVwXyZ...
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## 🆘 Problèmes courants

### "Même erreur après configuration"
→ Avez-vous **redémarré** le serveur Next.js ? (Ctrl+C puis `npm run dev`)

### "Invalid API key"
→ Vérifiez que vous utilisez bien les clés en mode **TEST** (commencent par `pk_test_` et `sk_test_`)

### "Price ID incorrect"
→ Dans Stripe Dashboard → Products → Cliquez sur votre produit → Le Price ID est affiché dans la section Pricing

### "Webhook secret manquant"
→ Normal ! Le webhook est seulement nécessaire en production. Laissez-le vide pour l'instant.

---

## 📚 Ressources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Documentation Stripe Products](https://stripe.com/docs/products-prices/getting-started)
- [Clés API Stripe](https://dashboard.stripe.com/test/apikeys)

---

Bon courage ! 🚀

