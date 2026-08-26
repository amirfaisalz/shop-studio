-- ==============================================================================
-- InsForge Database Schema Migration
-- Project: AI Shopify Template Builder
-- ==============================================================================

-- Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Projects Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  thumbnail_url TEXT,
  thumbnail_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 2. Project Pages Table (Stores page templates & generated HTML per tab)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'home',
  path TEXT NOT NULL DEFAULT '/',
  html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ready',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, page_key)
);

CREATE INDEX IF NOT EXISTS project_pages_project_id_idx ON public.project_pages(project_id);
CREATE INDEX IF NOT EXISTS project_pages_user_id_idx ON public.project_pages(user_id);

ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_pages_select_own" ON public.project_pages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "project_pages_insert_own" ON public.project_pages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_pages_update_own" ON public.project_pages
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_pages_delete_own" ON public.project_pages
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 3. Project Themes Table (Global CSS & AI design style guide)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  css TEXT NOT NULL DEFAULT '',
  style_guide TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_themes_project_id_idx ON public.project_themes(project_id);

ALTER TABLE public.project_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_themes_select_own" ON public.project_themes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "project_themes_insert_own" ON public.project_themes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_themes_update_own" ON public.project_themes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_themes_delete_own" ON public.project_themes
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 4. Project Messages Table (Chat history & AI revisions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_messages_project_id_idx ON public.project_messages(project_id);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_messages_select_own" ON public.project_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "project_messages_insert_own" ON public.project_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_messages_delete_own" ON public.project_messages
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 5. Theme Exports Table (Downloadable Shopify Theme ZIP archives)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.theme_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  download_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  file_size BIGINT NOT NULL DEFAULT 0,
  theme_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS theme_exports_project_id_key ON public.theme_exports(project_id);
CREATE INDEX IF NOT EXISTS theme_exports_user_id_idx ON public.theme_exports(user_id);

ALTER TABLE public.theme_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_exports_select_own" ON public.theme_exports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "theme_exports_insert_own" ON public.theme_exports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "theme_exports_update_own" ON public.theme_exports
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "theme_exports_delete_own" ON public.theme_exports
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 6. Subscriptions Table (Stripe Billing & Quotas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  billing_interval TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON public.subscriptions(stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
