-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS (Mails to Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Marketing_Director', 'Auditor', 'System_Admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CAMPAIGNS
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    product TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    price TEXT,
    campaign_goal TEXT CHECK (campaign_goal IN ('Awareness', 'Conversion', 'Retention', 'Other')),
    status TEXT CHECK (status IN ('Planning', 'Processing', 'Complete', 'Failed')) DEFAULT 'Planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BRAND GUIDELINES
CREATE TABLE public.brand_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) UNIQUE NOT NULL, -- 1:1 for this scope
    file_name TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('application/pdf', 'text/plain')),
    storage_path TEXT NOT NULL,
    extracted_text TEXT, -- Critical for Agents
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AGENT OUTPUTS (The Proof Ledger)
CREATE TABLE public.agent_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
    agent_name TEXT NOT NULL, -- Loose check to allow flexibility: 'PlanningAgent', etc.
    output_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATIVE VARIANTS (Mandatory for Creative Generation)
CREATE TABLE public.creative_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
    strategy_name TEXT,
    target_persona TEXT,
    prompt_text TEXT NOT NULL,
    temperature NUMERIC DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_variants ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own campaigns" ON public.campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own guidelines" ON public.brand_guidelines
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.campaigns WHERE id = brand_guidelines.campaign_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can view own agent outputs" ON public.agent_outputs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.campaigns WHERE id = agent_outputs.campaign_id AND user_id = auth.uid()
    ));
    
CREATE POLICY "Users can view own variants" ON public.creative_variants
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.campaigns WHERE id = creative_variants.campaign_id AND user_id = auth.uid()
    ));
