# ✅ Checklist de vérification Supabase pour Stripe

## À vérifier dans Supabase

### 1️⃣ Table `subscriptions` existe-t-elle ?

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet : `fvfacluheuyzrlnqqmzb`
3. **Table Editor** (menu de gauche)
4. Chercher la table **`subscriptions`**

✅ **Si elle existe** : Passez à l'étape 2  
❌ **Si elle n'existe PAS** : Exécutez le SQL ci-dessous (étape 6)

---

### 2️⃣ Vérifier les colonnes de la table `subscriptions`

La table doit avoir ces colonnes :

| Colonne | Type | Requis |
|---------|------|--------|
| `id` | UUID | ✅ PRIMARY KEY |
| `user_id` | UUID | ✅ REFERENCES auth.users(id) |
| `stripe_customer_id` | TEXT | ✅ UNIQUE |
| `stripe_subscription_id` | TEXT | ✅ UNIQUE |
| `stripe_price_id` | TEXT | ✅ |
| `status` | TEXT | ✅ |
| `current_period_start` | TIMESTAMP | ✅ |
| `current_period_end` | TIMESTAMP | ✅ |
| `quota_limit` | INTEGER | ✅ DEFAULT 50 |
| `quota_used` | INTEGER | ✅ DEFAULT 0 |
| `created_at` | TIMESTAMP | ✅ DEFAULT now() |
| `updated_at` | TIMESTAMP | ✅ DEFAULT now() |

**Comment vérifier** :
- Dans Table Editor → Cliquer sur `subscriptions` → Voir les colonnes

✅ **Si toutes les colonnes sont présentes** : Passez à l'étape 3  
❌ **Si des colonnes manquent** : Exécutez le SQL de l'étape 6

---

### 3️⃣ Vérifier les RLS Policies

1. Table Editor → `subscriptions`
2. Cliquer sur l'icône **🔒** (ou aller dans Authentication → Policies)
3. Filtrer par table `subscriptions`

**Policies requises** :

#### Policy 1 : Lecture par l'utilisateur
```
Name: "Users can view own subscription"
Command: SELECT
Using: (auth.uid() = user_id)
```

#### Policy 2 : Service role peut tout faire (IMPORTANT pour webhooks)
```
Name: "Service role can manage subscriptions"
Command: ALL
Using: true
With check: true
```

OU séparément :

```
Name: "Service role can insert subscriptions"
Command: INSERT
With check: true
```

```
Name: "Service role can update subscriptions"
Command: UPDATE
Using: true
```

✅ **Si les policies existent** : Parfait !  
❌ **Si elles manquent** : Exécutez le SQL de l'étape 6

---

### 4️⃣ Vérifier que RLS est activé

Dans Table Editor → `subscriptions` → en haut à droite, vous devriez voir :

```
RLS enabled ✅
```

✅ **Si RLS est activé** : Parfait !  
❌ **Si RLS est désactivé** : Exécutez `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;`

---

### 5️⃣ Vérifier les index (optionnel mais recommandé)

Les index accélèrent les recherches. Vérifiez-les via **SQL Editor** :

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'subscriptions';
```

**Index recommandés** :
- `idx_subscriptions_user_id`
- `idx_subscriptions_stripe_customer_id`
- `idx_subscriptions_stripe_subscription_id`

✅ **Si les index existent** : Parfait !  
❌ **Si absents** : Exécutez le SQL de l'étape 6

---

### 6️⃣ SQL complet pour créer/corriger la configuration

Si quelque chose manque, exécutez ce SQL dans **SQL Editor** :

```sql
-- ========================================
-- CRÉATION TABLE SUBSCRIPTIONS (si elle n'existe pas)
-- ========================================

CREATE TABLE IF NOT EXISTS subscriptions (
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

-- ========================================
-- INDEX POUR PERFORMANCES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id 
ON subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id 
ON subscriptions(stripe_subscription_id);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Activer RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leur propre abonnement
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Policy : Service role peut tout faire (CRITIQUE pour webhooks)
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriptions;
CREATE POLICY "Service role can insert subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
CREATE POLICY "Service role can update subscriptions"
ON subscriptions FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Service role can delete subscriptions" ON subscriptions;
CREATE POLICY "Service role can delete subscriptions"
ON subscriptions FOR DELETE
USING (true);
```

**Comment exécuter** :
1. Supabase → **SQL Editor**
2. Copier-coller le SQL ci-dessus
3. Cliquer **RUN**
4. Vérifier qu'il n'y a pas d'erreur

---

### 7️⃣ Tester la configuration avec un INSERT manuel

Pour vérifier que tout fonctionne, testez un INSERT dans **SQL Editor** :

```sql
-- Remplacez USER_ID_ICI par votre vrai user ID (trouvable dans auth.users)
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  quota_limit,
  quota_used,
  current_period_start,
  current_period_end
) VALUES (
  'USER_ID_ICI',  -- ⚠️ REMPLACER par votre user_id
  'cus_test123',
  'sub_test123',
  'price_1SIrbeI3UGrMxctxAmKCxqxC',
  'active',
  50,
  0,
  NOW(),
  NOW() + INTERVAL '1 month'
);
```

✅ **Si ça fonctionne** : Supabase est correctement configuré !  
❌ **Si erreur** : Vérifier le message d'erreur et corriger

Après le test, supprimez cette ligne de test :
```sql
DELETE FROM subscriptions WHERE stripe_customer_id = 'cus_test123';
```

---

## 🎯 Résultat attendu

Après vérification/correction, vous devriez avoir :

✅ Table `subscriptions` créée avec 12 colonnes  
✅ 3 index pour performances  
✅ RLS activé  
✅ 4 policies configurées (1 SELECT user, 3 pour service_role)  
✅ INSERT manuel fonctionne  

---

## 🧪 Test final : Tester le webhook

Une fois la configuration vérifiée, testez votre webhook :

### Option 1 : Test manuel depuis Stripe

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer sur votre endpoint
3. **Send test webhook**
4. Sélectionner `checkout.session.completed`
5. Modifier le JSON pour ajouter :
```json
{
  "metadata": {
    "user_id": "VOTRE_VRAI_USER_ID_SUPABASE"
  },
  "mode": "subscription",
  "customer": "cus_test456",
  "subscription": "sub_test456"
}
```
6. **Send test webhook**
7. Vérifier dans Supabase → Table `subscriptions` si une ligne apparaît

### Option 2 : Test réel avec paiement

1. `npm run dev`
2. Aller sur http://localhost:3000/pricing
3. Cliquer "S'abonner" sur le Plan Basic
4. Payer avec la carte : `4242 4242 4242 4242`

⚠️ **IMPORTANT** : En local, le webhook ne fonctionnera PAS car Stripe ne peut pas atteindre localhost. Pour tester les webhooks en local, il faut utiliser **Stripe CLI** (voir WEBHOOK_DEBUG.md).

Pour que les webhooks fonctionnent réellement, il faut **déployer sur Vercel**.

---

## 📊 Vérification complète

Cochez ce qui est fait :

- [ ] Table `subscriptions` existe
- [ ] 12 colonnes présentes
- [ ] 3 index créés
- [ ] RLS activé
- [ ] Policies créées (SELECT user + INSERT/UPDATE/DELETE service)
- [ ] INSERT manuel fonctionne
- [ ] Webhook configuré dans Stripe
- [ ] STRIPE_WEBHOOK_SECRET dans .env.local

---

## 🚀 Prochaine étape

Si tout est ✅, vous pouvez :

1. **Tester en local** (sans webhook fonctionnel)
2. **Déployer sur Vercel** pour avoir les webhooks qui marchent
3. **Tester en production** avec un vrai paiement

---

**Besoin d'aide ?** Envoyez-moi les messages d'erreur si quelque chose ne fonctionne pas !

