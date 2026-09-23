-- =============================================================================
-- MIGRACIÓN ADITIVA: MODELO DE PROPONENTE PARA MÍNIMA CUANTÍA Y RUTA SIN RUP
-- Compatible con PostgreSQL + Supabase + RLS sin alterar datos existentes.
-- =============================================================================

-- 1. Columnas aditivas en public.organizations para soportar ambas rutas
ALTER TABLE public.organizations 
    ADD COLUMN IF NOT EXISTS onboarding_route VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS rup_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS ficha_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS profile_completeness INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS access_permissions JSONB DEFAULT '{"can_access_minima_cuantia": false, "can_access_general_tenders": false}'::jsonb,
    ADD COLUMN IF NOT EXISTS proponent_type VARCHAR(50) DEFAULT 'persona_juridica',
    ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
    ADD COLUMN IF NOT EXISTS declared_activity TEXT,
    ADD COLUMN IF NOT EXISTS offered_goods_services TEXT,
    ADD COLUMN IF NOT EXISTS target_sectors JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS geographic_coverage JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS technical_capacities TEXT,
    ADD COLUMN IF NOT EXISTS search_keywords JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS has_secop_account BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_condition VARCHAR(100) DEFAULT 'mipyme',
    ADD COLUMN IF NOT EXISTS proponent_file_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Índices para acelerar búsquedas
CREATE INDEX IF NOT EXISTS idx_organizations_route ON public.organizations(onboarding_route);
CREATE INDEX IF NOT EXISTS idx_organizations_permissions ON public.organizations USING gin (access_permissions);

-- 3. Comentarios de documentación de esquema
COMMENT ON COLUMN public.organizations.onboarding_route IS 'Ruta de incorporación: pending, with_rup, without_rup_minima_cuantia';
COMMENT ON COLUMN public.organizations.rup_status IS 'Estado del RUP: pending, uploading, processing, requires_correction, confirmed';
COMMENT ON COLUMN public.organizations.ficha_status IS 'Estado de la Ficha: pending, uploading, processing, requires_correction, confirmed';
COMMENT ON COLUMN public.organizations.access_permissions IS 'Permisos efectivos verificados por el servidor para la organización';
