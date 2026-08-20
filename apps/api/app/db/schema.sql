-- =============================================================================
-- ESQUEMA DE BASE DE DATOS - PLATAFORMA SAAS DE LICITACIONES SECOP I/II & DATOS ABIERTOS
-- PostgreSQL + Supabase + pgvector + RLS
-- =============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. TABLA: ORGANIZATIONS (EMPRESAS / CLIENTES SAAS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nit VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    department VARCHAR(100),
    economic_sector VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_nit ON public.organizations(nit);

-- -----------------------------------------------------------------------------
-- 2. TABLA: USERS (USUARIOS DE LA PLATAFORMA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Foreign key a auth.users de Supabase
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);

-- -----------------------------------------------------------------------------
-- 3. TABLA: FINANCIAL_PROFILES (PERFIL FINANCIERO Y RUP DE LA EMPRESA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    year INT NOT NULL,
    current_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,     -- Activo Corriente
    current_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,  -- Pasivo Corriente
    total_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,        -- Activo Total
    total_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,   -- Pasivo Total
    operating_income NUMERIC(18, 2) NOT NULL DEFAULT 0,    -- Utilidad Operacional
    interest_expense NUMERIC(18, 2) NOT NULL DEFAULT 0,    -- Gastos de Intereses
    net_equity NUMERIC(18, 2) NOT NULL DEFAULT 0,          -- Patrimonio Neto
    liquidity_ratio NUMERIC(10, 4),                         -- Ind. Liquidez (Activo Corr / Pasivo Corr)
    debt_ratio NUMERIC(10, 4),                              -- Ind. Endeudamiento (Pasivo Total / Activo Total)
    interest_coverage_ratio NUMERIC(10, 4),               -- Cobertura Intereses (Utilidad Op / Gastos Int)
    roa NUMERIC(10, 4),                                     -- ROA (Utilidad Op / Activo Total)
    roe NUMERIC(10, 4),                                     -- ROE (Utilidad Op / Patrimonio)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, year)
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: COMPANY_EXPERIENCES (EXPERIENCIA RUP ACREDITADA DE LA EMPRESA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contract_name VARCHAR(500) NOT NULL,
    contracting_entity VARCHAR(255) NOT NULL,
    contract_number VARCHAR(100),
    value_cop NUMERIC(18, 2) NOT NULL,
    value_smmlv NUMERIC(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    unspsc_codes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de códigos UNSPSC
    certification_doc_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_experiences_org ON public.company_experiences(organization_id);

-- -----------------------------------------------------------------------------
-- 5. TABLA: TENDERS (LICITACIONES MONITOREADAS DE SECOP I, II Y DATOS ABIERTOS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_platform VARCHAR(50) NOT NULL, -- 'SECOP_I', 'SECOP_II', 'DATOS_ABIERTOS'
    secop_id VARCHAR(100) NOT NULL UNIQUE,
    process_number VARCHAR(100) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_nit VARCHAR(50),
    title TEXT NOT NULL,
    description TEXT,
    contract_type VARCHAR(100),
    budget_cop NUMERIC(18, 2) NOT NULL,
    budget_smmlv NUMERIC(12, 2),
    department VARCHAR(100),
    city VARCHAR(100),
    publication_date TIMESTAMPTZ,
    closing_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'awarded', 'suspended'
    unspsc_codes JSONB DEFAULT '[]'::jsonb,
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenders_secop_id ON public.tenders(secop_id);
CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON public.tenders(closing_date);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);

-- -----------------------------------------------------------------------------
-- 6. TABLA: TENDER_DOCUMENTS (DOCUMENTOS Y PLIEGOS DE CONDICIONES)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tender_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'pliego', 'anexo', 'adenda', 'estudio_previo'
    storage_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    ocr_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tender_docs_tender ON public.tender_documents(tender_id);

-- -----------------------------------------------------------------------------
-- 7. TABLA: TENDER_EMBEDDINGS (VECTORES DE BÚSQUEDA SEMÁNTICA CON PGVECTOR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tender_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.tender_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding vector(1536), -- Vector OpenAI / Compatible (1536 dims)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tender_embeddings_vector ON public.tender_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- -----------------------------------------------------------------------------
-- 8. TABLA: TENDER_REQUIREMENTS (REQUISITOS EXTRAÍDOS POR LA IA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tender_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    
    -- Requisitos Financieros Exigidos
    min_liquidity_ratio NUMERIC(10, 4),
    max_debt_ratio NUMERIC(10, 4),
    min_interest_coverage NUMERIC(10, 4),
    min_roa NUMERIC(10, 4),
    min_roe NUMERIC(10, 4),
    min_patrimony_cop NUMERIC(18, 2),
    
    -- Requisitos de Experiencia Exigidos
    required_unspsc JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_experience_contracts_count INT DEFAULT 1,
    min_experience_smmlv NUMERIC(12, 2),
    max_experience_contracts_count INT,
    
    -- Requisitos Jurídicos y Adicionales
    legal_conditions TEXT,
    consortium_allowed BOOLEAN DEFAULT TRUE,
    guarantees_required JSONB DEFAULT '[]'::jsonb,
    
    raw_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. TABLA: COMPATIBILITY_EVALUATIONS (SCORES Y EXPLICACIÓN DE IA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compatibility_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    
    overall_score NUMERIC(5, 2) NOT NULL, -- 0.00 a 100.00
    financial_score NUMERIC(5, 2) NOT NULL,
    experience_score NUMERIC(5, 2) NOT NULL,
    legal_score NUMERIC(5, 2) NOT NULL,
    
    verdict VARCHAR(50) NOT NULL, -- 'RECOMMENDED', 'RISKY', 'NOT_RECOMMENDED'
    summary_reason TEXT NOT NULL,
    detailed_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    identified_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_level NUMERIC(5, 2) NOT NULL DEFAULT 95.0,
    
    evaluated_by_model VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, tender_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_org_score ON public.compatibility_evaluations(organization_id, overall_score DESC);

-- -----------------------------------------------------------------------------
-- 10. TABLA: SUBMISSION_CHECKLISTS (GESTIÓN Y ASISTENCIA DE POSTULACIÓN)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submission_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'in_progress', 'ready_for_submission', 'submitted'
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, tender_id)
);

-- -----------------------------------------------------------------------------
-- CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS) - EJECUTADO TRAS CREAR TODAS LAS TABLAS
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access their organization" ON public.organizations;
CREATE POLICY "Users can access their organization" ON public.organizations
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE organization_id = public.organizations.id
    ));

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view same org users" ON public.users;
CREATE POLICY "Users view same org users" ON public.users
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
    ));

-- -----------------------------------------------------------------------------
-- TRIGGER DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP `updated_at`
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_financial_profiles BEFORE UPDATE ON public.financial_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_company_experiences BEFORE UPDATE ON public.company_experiences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_tenders BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_tender_requirements BEFORE UPDATE ON public.tender_requirements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_compatibility_evaluations BEFORE UPDATE ON public.compatibility_evaluations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
