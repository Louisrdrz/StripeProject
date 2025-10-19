# 🚨 Fix Rapide - Erreur Stripe "No such price: 'price_basic'"

## 🎯 Problème
Votre application utilise des IDs de prix fictifs (`price_basic`, `price_pro`) qui n'existent pas dans Stripe.

## ✅ Solution Rapide (5 minutes)

### Étape 1 : Aller sur Stripe Dashboard
👉 **https://dashboard.stripe.com**

### Étape 2 : Créer les Prix

#### Prix 1 - Plan Basic
1. **Products** → **+ Add product**
2. **Name** : `Plan Basic`
3. **Pricing model** : **Recurring** ⭐
4. **Price** : `9.00` EUR
5. **Billing period** : **Monthly**
6. **Add product**
7. ⚠️ **COPIER LE PRICE ID** (commence par `price_...`)

#### Prix 2 - Plan Pro
1. **+ Add product**
2. **Name** : `Plan Pro`
3. **Pricing model** : **Recurring** ⭐
4. **Price** : `19.00` EUR
5. **Billing period** : **Monthly**
6. **Add product**
7. ⚠️ **COPIER LE PRICE ID**

### Étape 3 : Récupérer les clés API
1. **Developers** → **API keys**
2. Copier la **Publishable key** (pk_test_...)
3. Copier la **Secret key** (sk_test_...)

### Étape 4 : Créer/Modifier .env.local

À la racine de votre projet, créez (ou modifiez) le fichier `.env.local` :

```env
# Vos clés Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_COLLEZ_VOTRE_CLE_ICI
STRIPE_SECRET_KEY=sk_test_COLLEZ_VOTRE_CLE_ICI

# Les Price IDs que vous avez copiés
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_COLLEZ_ID_BASIC_ICI
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_COLLEZ_ID_PRO_ICI

# Webhook (laisser vide pour l'instant)
STRIPE_WEBHOOK_SECRET=

# URL de l'app
NEXT_PUBLIC_URL=http://localhost:3000
```

### Étape 5 : Redémarrer le serveur

```bash
# Dans votre terminal, arrêter le serveur (Ctrl+C)
# Puis relancer :
npm run dev
```

### Étape 6 : Tester

1. Ouvrir **http://localhost:3000/pricing**
2. Cliquer sur **"S'abonner maintenant"**
3. Vous devriez voir la page Stripe Checkout ✅

---

## 🧪 Tester le paiement

Utilisez ces données de test :
- **Numéro de carte** : `4242 4242 4242 4242`
- **Date** : 12/34 (n'importe quelle date future)
- **CVC** : 123 (n'importe quels 3 chiffres)

---

## 📖 Guide détaillé

Pour plus de détails, consultez **STRIPE_SETUP.md**

---

## ❓ Besoin d'aide ?

Si ça ne fonctionne pas, vérifiez :
- [ ] Vous avez bien créé 2 produits RÉCURRENTS (pas one-time)
- [ ] Vous avez copié les bons Price IDs (commence par `price_`)
- [ ] Vous avez **redémarré** le serveur après modification du .env.local
- [ ] Le fichier .env.local est bien à la **racine** du projet

