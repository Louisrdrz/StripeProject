-- ========================================
-- 🔍 SCRIPT DE DIAGNOSTIC SUPABASE POUR STRIPE
-- ========================================
-- Exécutez ce script dans Supabase SQL Editor pour vérifier votre configuration

-- ========================================
-- 1️⃣ Vérifier si la table subscriptions existe
-- ========================================
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
  ) AS table_exists;

-- Si retourne "true" ✅ : La table existe
-- Si retourne "false" ❌ : La table n'existe pas, il faut la créer

-- ========================================
-- 2️⃣ Vérifier les colonnes de la table subscriptions
-- ========================================
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- ✅ Vous devriez voir 12 colonnes :
-- id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
-- status, current_period_start, current_period_end, quota_limit, quota_used,
-- created_at, updated_at

-- ========================================
-- 3️⃣ Vérifier les index
-- ========================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'subscriptions';

-- ✅ Vous devriez voir au minimum :
-- - subscriptions_pkey (index primaire sur id)
-- - idx_subscriptions_user_id
-- - idx_subscriptions_stripe_customer_id
-- - idx_subscriptions_stripe_subscription_id

-- ========================================
-- 4️⃣ Vérifier si RLS est activé
-- ========================================
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'subscriptions';

-- ✅ rowsecurity doit être "true"

-- ========================================
-- 5️⃣ Vérifier les RLS Policies
-- ========================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'subscriptions';

-- ✅ Vous devriez voir au moins :
-- - "Users can view own subscription" (cmd: SELECT)
-- - Policies pour INSERT/UPDATE/DELETE avec service_role

-- ========================================
-- 6️⃣ Vérifier les contraintes (foreign keys, unique)
-- ========================================
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE con.contype::text
  END AS constraint_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'subscriptions';

-- ✅ Vous devriez voir :
-- - PRIMARY KEY sur id
-- - FOREIGN KEY sur user_id → auth.users(id)
-- - UNIQUE sur stripe_customer_id
-- - UNIQUE sur stripe_subscription_id

-- ========================================
-- 7️⃣ Compter les abonnements existants
-- ========================================
SELECT 
  COUNT(*) AS total_subscriptions,
  COUNT(DISTINCT user_id) AS total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_subscriptions,
  COUNT(CASE WHEN status = 'canceled' THEN 1 END) AS canceled_subscriptions
FROM subscriptions;

-- ========================================
-- 8️⃣ Afficher les abonnements (si il y en a)
-- ========================================
SELECT 
  id,
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  quota_limit,
  quota_used,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- ✅ RÉSUMÉ DIAGNOSTIC
-- ========================================
-- Exécutez toutes ces requêtes une par une et notez les résultats.
-- Si une requête retourne une erreur ou un résultat vide, cela indique un problème.

-- Si la table n'existe pas du tout, exécutez le fichier SQL de création :
-- Voir le fichier VERIFIER_SUPABASE_STRIPE.md section 6

-- ========================================
-- 🔧 CORRECTION RAPIDE (si besoin)
-- ========================================

-- Si la table n'existe pas, décommentez et exécutez tout le bloc ci-dessous :

/*
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

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
ON subscriptions FOR UPDATE
USING (true);

CREATE POLICY "Service role can delete subscriptions"
ON subscriptions FOR DELETE
USING (true);
*/

-- ========================================
-- FIN DU DIAGNOSTIC
-- ========================================

