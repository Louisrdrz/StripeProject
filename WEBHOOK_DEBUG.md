# 🐛 Pourquoi mon abonnement ne s'affiche pas ?

## ❌ Le Problème

Vous avez payé avec succès sur Stripe, mais l'abonnement n'apparaît pas dans votre dashboard. La table `subscriptions` dans Supabase est **vide**.

### Cause : Le Webhook n'a pas été déclenché

**Les webhooks ne fonctionnent PAS en `localhost` !**

Stripe essaie d'envoyer un événement à votre serveur, mais comme vous êtes sur `localhost:3000`, Stripe ne peut pas atteindre votre machine depuis internet.

```
❌ localhost:3000 → Inaccessible depuis internet
✅ https://votre-site.vercel.app → Accessible depuis internet
```

---

## ✅ Solutions

### Solution 1 : Tester avec Stripe CLI (Recommandé pour le développement local)

Stripe CLI permet de **rediriger les webhooks vers votre localhost** pendant le développement.

#### Étape 1 : Installer Stripe CLI

**Windows (avec Chocolatey)** :
```bash
choco install stripe-cli
```

**Sinon, téléchargez depuis** : https://github.com/stripe/stripe-cli/releases/latest

#### Étape 2 : Authentifier Stripe CLI

```bash
stripe login
```
→ Une page web s'ouvre, confirmez l'accès

#### Étape 3 : Rediriger les webhooks vers localhost

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Vous verrez :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

#### Étape 4 : Copier le webhook secret

Copiez le `whsec_xxxxxxxxxxxxx` et mettez-le dans votre `.env.local` :

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Étape 5 : Redémarrer le serveur Next.js

```bash
# Arrêtez npm run dev (Ctrl+C)
# Relancez :
npm run dev
```

#### Étape 6 : Tester l'abonnement

1. **Laissez `stripe listen` tourner** dans un terminal
2. Dans un autre terminal, lancez `npm run dev`
3. Allez sur http://localhost:3000/pricing
4. Souscrivez à un plan avec la carte test `4242 4242 4242 4242`
5. Dans le terminal `stripe listen`, vous verrez les événements en temps réel :
   ```
   checkout.session.completed [evt_xxxxx]
   customer.subscription.created [evt_xxxxx]
   ```
6. Vérifiez dans Supabase → Table `subscriptions` → Une ligne doit apparaître ! ✅

---

### Solution 2 : Déployer sur Vercel (Recommandé pour la production)

C'est la solution du workshop, la plus propre.

#### Étape 1 : Commit et push

```bash
git add .
git commit -m "Add Stripe subscriptions"
git push
```

#### Étape 2 : Configurer les variables d'environnement sur Vercel

1. Allez sur https://vercel.com → votre projet
2. **Settings** → **Environment Variables**
3. Ajoutez :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_KEY=eyJhbGc...
   REPLICATE_API_TOKEN=r8_...
   REPLICATE_MODEL_ID=google/nano-banana
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_...
   NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_...
   NEXT_PUBLIC_URL=https://votre-projet.vercel.app
   STRIPE_WEBHOOK_SECRET=(laisser vide pour l'instant)
   ```
4. Cliquez sur **Save**

#### Étape 3 : Configurer le webhook dans Stripe

1. Allez sur https://dashboard.stripe.com
2. **Developers** → **Webhooks**
3. Cliquez **+ Add endpoint**
4. **Endpoint URL** : `https://votre-projet.vercel.app/api/webhooks/stripe`
5. **Select events** :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Cliquez **Add endpoint**
7. **Copier le Signing secret** : `whsec_xxxxx...`

#### Étape 4 : Ajouter le webhook secret dans Vercel

1. Retournez dans Vercel → **Settings** → **Environment Variables**
2. Modifiez `STRIPE_WEBHOOK_SECRET` et collez le secret
3. **Deployments** → … → **Redeploy** (pour recharger les variables)

#### Étape 5 : Tester sur Vercel

1. Allez sur `https://votre-projet.vercel.app/pricing`
2. Souscrivez avec la carte test `4242 4242 4242 4242`
3. L'abonnement doit maintenant apparaître sur `/dashboard` ! ✅

---

### Solution 3 : Créer manuellement l'abonnement (Pour tester rapidement)

Si vous voulez juste tester que tout fonctionne côté frontend sans configurer les webhooks :

#### Étape 1 : Aller dans Supabase Table Editor

1. **Table Editor** → `subscriptions`
2. Cliquez **Insert** → **Insert row**
3. Remplissez :
   ```
   user_id: [VOTRE USER ID - copiez depuis auth.users]
   stripe_customer_id: cus_fake123
   stripe_subscription_id: sub_fake123
   stripe_price_id: price_1SIrbeI3UGrMxctxAmKCxqxC (votre BASIC price ID)
   status: active
   quota_limit: 50
   quota_used: 0
   current_period_start: 2025-01-15 00:00:00+00
   current_period_end: 2025-02-15 00:00:00+00
   ```
4. Cliquez **Save**

#### Étape 2 : Rafraîchir le dashboard

Rechargez http://localhost:3000/dashboard → l'abonnement doit s'afficher !

⚠️ **Attention** : Cette méthode est temporaire pour tester. En production, utilisez la Solution 1 ou 2.

---

## 🔍 Vérifier que tout fonctionne

### 1. Dans Stripe Dashboard

- **Payments** → Vous voyez le paiement test
- **Subscriptions** → Vous voyez l'abonnement actif
- **Developers** → **Webhooks** → Votre endpoint → **Recent deliveries** → ✅ vert

### 2. Dans Supabase

- **Table Editor** → `subscriptions` → Vous voyez une ligne avec :
  - `user_id` = votre ID utilisateur
  - `status` = `active`
  - `quota_limit` = `50` ou `200`
  - `quota_used` = `0`

### 3. Sur votre site

- `/dashboard` → Vous voyez "Plan Basic - 0/50 générations restantes"
- Le bouton "Gérer" fonctionne (ouvre le Stripe Customer Portal)

---

## ❓ Quelle solution choisir ?

| Situation | Solution recommandée |
|-----------|---------------------|
| Je développe en local et je veux tester les webhooks | ✅ Solution 1 - Stripe CLI |
| Je veux déployer en production | ✅ Solution 2 - Déployer sur Vercel |
| Je veux juste tester le frontend rapidement | Solution 3 - Insertion manuelle |

---

## 🆘 Toujours pas de webhook ?

### Vérifier les logs Vercel (si déployé)

1. Vercel → votre projet → **Logs**
2. Filtrer par `/api/webhooks/stripe`
3. Cherchez les erreurs :
   - `Webhook signature verification failed` → Mauvais `STRIPE_WEBHOOK_SECRET`
   - `user_id is undefined` → Le metadata n'est pas passé
   - `401 Unauthorized` → Problème RLS Supabase

### Tester manuellement le webhook depuis Stripe

1. Stripe Dashboard → **Developers** → **Webhooks**
2. Cliquez sur votre endpoint
3. **Send test webhook**
4. Sélectionnez `checkout.session.completed`
5. Modifiez le JSON pour ajouter :
   ```json
   {
     "metadata": {
       "user_id": "votre-vrai-user-id-supabase"
     },
     "mode": "subscription",
     "customer": "cus_fake123",
     "subscription": "sub_fake123"
   }
   ```
6. **Send test webhook**
7. Vérifiez les logs pour voir l'erreur exacte

---

Bonne chance ! 🚀

