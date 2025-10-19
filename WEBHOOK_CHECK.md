# 🔧 Guide de vérification du webhook Stripe

## Problème : L'abonnement apparaît dans Stripe mais pas dans Supabase

### ✅ Checklist de vérification

#### 1. Vérifier que le webhook est configuré dans Stripe

1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Vérifier qu'un endpoint existe avec l'URL : `https://votre-site.vercel.app/api/webhooks/stripe`
3. Vérifier que les événements suivants sont cochés :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`

#### 2. Récupérer le Signing Secret du webhook

1. Dans Stripe → Webhooks → Cliquer sur votre endpoint
2. Cliquer sur **"Reveal"** à côté de "Signing secret"
3. **Copier** le secret (commence par `whsec_...`)

#### 3. Vérifier/Ajouter le secret dans Vercel

1. Aller sur [Vercel](https://vercel.com) → votre projet
2. **Settings** → **Environment Variables**
3. Chercher `STRIPE_WEBHOOK_SECRET`
   
   **Si elle n'existe pas :**
   - Cliquer **Add New**
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: Coller le `whsec_...` copié depuis Stripe
   - Environment: Cocher **Production**, **Preview**, **Development**
   - Cliquer **Save**

   **Si elle existe déjà :**
   - Vérifier qu'elle a bien une valeur (pas vide)
   - Vérifier que c'est le bon secret (celui de votre endpoint)
   - Si vous n'êtes pas sûr, supprimez et recréez

4. **IMPORTANT** : Redéployer après avoir ajouté/modifié la variable
   - Aller dans **Deployments**
   - Sur le dernier déploiement, cliquer sur les **3 points (...)** → **Redeploy**
   - Cocher **"Use existing Build Cache"** → **Redeploy**

#### 4. Tester le webhook manuellement depuis Stripe

Maintenant qu'on a configuré le secret, testons manuellement :

1. Dans Stripe → **Developers** → **Webhooks** → votre endpoint
2. Cliquer sur l'onglet **"Send test webhook"**
3. Sélectionner l'événement : `checkout.session.completed`
4. Cliquer **Send test event**
5. Regarder le résultat :
   - ✅ **200 OK** avec `{"received": true}` = C'EST BON ! 🎉
   - ❌ **400, 401, 500** = Il y a encore un problème

#### 5. Vérifier les "Recent deliveries" dans Stripe

1. Toujours dans Stripe → Webhooks → votre endpoint
2. Onglet **"Recent deliveries"** (ou "Tentatives récentes")
3. Vous devriez voir vos tentatives de paiement test
4. Cliquer sur une tentative :
   - ✅ Icône verte = webhook réussi
   - ❌ Icône rouge = webhook échoué
5. Si rouge, cliquer dessus pour voir :
   - Le **code HTTP** (400, 401, 500...)
   - Le **message d'erreur** retourné par votre API
   - Le **payload** envoyé

#### 6. Vérifier les logs Vercel

1. Vercel → votre projet → **Logs**
2. Filtrer par `/api/webhooks/stripe` ou chercher "webhook"
3. Vous devriez voir :
   ```
   Webhook reçu: checkout.session.completed
   Abonnement créé avec succès pour user: xxx-xxx-xxx
   ```
4. Si vous voyez une erreur, elle vous dira exactement quoi corriger

---

## 🐛 Erreurs fréquentes et solutions

### Erreur 1 : "No webhook signature found"

**Logs Vercel :**
```
Erreur vérification signature: No signatures found matching the expected signature
```

**Cause :** `STRIPE_WEBHOOK_SECRET` n'est pas configuré ou est vide

**Solution :**
1. Vérifier dans Vercel → Environment Variables que `STRIPE_WEBHOOK_SECRET` existe et a une valeur
2. Si manquant, l'ajouter (voir étape 3 ci-dessus)
3. Redéployer sur Vercel

---

### Erreur 2 : "user_id manquant dans metadata"

**Logs Vercel :**
```
user_id manquant dans metadata
```

**Cause :** Le `user_id` n'est pas passé lors de la création de la checkout session

**Solution :**
Votre code est déjà correct (ligne 110 de `create-subscription-checkout/route.ts`).
Si vous voyez quand même cette erreur, c'est que vous testez avec un webhook envoyé AVANT d'avoir déployé le bon code.

**Solution :** Faire un nouveau test de paiement (avec une nouvelle carte test)

---

### Erreur 3 : "duplicate key value violates unique constraint"

**Logs Vercel :**
```
duplicate key value violates unique constraint "subscriptions_stripe_customer_id_key"
```

**Cause :** Un abonnement existe déjà dans Supabase pour ce customer

**Solution :**
1. Aller dans Supabase → Table Editor → `subscriptions`
2. Supprimer les anciennes lignes de test
3. Refaire un test de paiement

---

### Erreur 4 : "new row violates row-level security policy"

**Logs Vercel :**
```
new row violates row-level security policy for table "subscriptions"
```

**Cause :** Les RLS policies bloquent l'insertion par la service key

**Solution :**
Votre webhook utilise bien `SUPABASE_SERVICE_KEY` donc ça devrait passer.
Mais vérifiez quand même dans Supabase → Authentication → Policies :

```sql
-- Cette policy doit exister (pour INSERT)
-- Si elle n'existe pas, créez-la :

CREATE POLICY "Service role can insert subscriptions" 
ON subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions" 
ON subscriptions 
FOR UPDATE 
USING (true);
```

---

### Erreur 5 : Le webhook ne reçoit rien (aucun log)

**Symptôme :** Aucun log dans Vercel, aucune tentative dans Stripe "Recent deliveries"

**Cause possible :**
1. L'URL du webhook est incorrecte dans Stripe
2. Le site Vercel n'est pas accessible

**Solution :**
1. Vérifier l'URL dans Stripe : doit être EXACTEMENT `https://votre-site.vercel.app/api/webhooks/stripe`
2. Tester que le site est accessible : ouvrir `https://votre-site.vercel.app` dans le navigateur
3. Supprimer et recréer le webhook dans Stripe

---

## ✅ Quand tout fonctionne

Vous devriez voir :

**Dans Stripe → Webhooks → Recent deliveries :**
- ✅ Icônes vertes avec code 200

**Dans Vercel → Logs :**
```
Webhook reçu: checkout.session.completed
✅ Abonnement créé avec succès pour user: xxx-xxx-xxx
```

**Dans Supabase → Table subscriptions :**
- Une nouvelle ligne avec :
  - `user_id` = votre user ID
  - `status` = 'active'
  - `quota_limit` = 50 (ou 200 si Pro)
  - `quota_used` = 0
  - `stripe_customer_id` = 'cus_...'
  - `stripe_subscription_id` = 'sub_...'

**Sur votre dashboard :**
- "Plan Basic - 0/50 générations restantes"

---

## 🧪 Commande rapide de test

Une fois que vous pensez avoir tout configuré, testez rapidement :

1. Stripe → Webhooks → votre endpoint → **Send test webhook**
2. Événement : `checkout.session.completed`
3. Cliquer **Send**
4. Vérifier le code de réponse : doit être **200 OK**

Si c'est bon, faites un vrai test de paiement avec la carte `4242 4242 4242 4242`.

---

## 📞 Besoin d'aide ?

Si le problème persiste après avoir suivi ce guide :

1. Copier les logs d'erreur depuis Vercel
2. Copier le message d'erreur depuis Stripe "Recent deliveries"
3. Vérifier que vous avez bien fait toutes les étapes ci-dessus

