-- =============================================================================
-- SINCRONIZACIÓN AUTOMÁTICA DE USUARIOS EN SUPABASE (auth.users -> public.users)
-- =============================================================================
-- Script corregido y probado para Supabase SQL Editor.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: ORGANIZATIONS
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

-- 2. TABLA: USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- ID del usuario en auth.users
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL DEFAULT 'Usuario',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'owner', -- 'owner', 'admin', 'member'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);

-- 3. FUNCIÓN: handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_org_id UUID;
    v_nit VARCHAR(20);
    v_company_name VARCHAR(255);
    v_first_name VARCHAR(100);
    v_last_name VARCHAR(100);
    v_user_email VARCHAR(255);
    v_user_role VARCHAR(50);
BEGIN
    v_user_email := COALESCE(NEW.email, 'usuario@licitia.co');
    
    v_company_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        INITCAP(REPLACE(split_part(v_user_email, '@', 1), '.', ' ')) || ' S.A.S.'
    );
    
    v_nit := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'nit'), ''),
        'NIT-' || UPPER(SUBSTRING(NEW.id::text, 1, 8))
    );
    
    v_first_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
        NULLIF(TRIM(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)), ''),
        INITCAP(split_part(v_user_email, '@', 1)),
        'Usuario'
    );
    
    v_last_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
        NULLIF(TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '') FROM ' .*')), ''),
        ''
    );

    v_user_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'owner');

    -- 3.1 Buscar o crear organización
    SELECT id INTO v_org_id 
    FROM public.organizations 
    WHERE nit = v_nit OR email = v_user_email
    LIMIT 1;

    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (
            nit,
            name,
            email,
            is_active
        ) VALUES (
            v_nit,
            v_company_name,
            v_user_email,
            TRUE
        )
        ON CONFLICT (nit) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_org_id;
    END IF;

    -- 3.2 Insertar o actualizar usuario
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
        UPDATE public.users SET
            email = v_user_email,
            first_name = CASE WHEN v_first_name <> '' AND v_first_name <> 'Usuario' THEN v_first_name ELSE public.users.first_name END,
            last_name = CASE WHEN v_last_name <> '' THEN v_last_name ELSE public.users.last_name END,
            organization_id = v_org_id,
            updated_at = NOW()
        WHERE auth_user_id = NEW.id;
    ELSIF EXISTS (SELECT 1 FROM public.users WHERE email = v_user_email) THEN
        UPDATE public.users SET
            auth_user_id = NEW.id,
            organization_id = v_org_id,
            first_name = CASE WHEN v_first_name <> '' AND v_first_name <> 'Usuario' THEN v_first_name ELSE public.users.first_name END,
            last_name = CASE WHEN v_last_name <> '' THEN v_last_name ELSE public.users.last_name END,
            updated_at = NOW()
        WHERE email = v_user_email;
    ELSE
        INSERT INTO public.users (
            auth_user_id,
            organization_id,
            first_name,
            last_name,
            email,
            role,
            updated_at
        ) VALUES (
            NEW.id,
            v_org_id,
            v_first_name,
            v_last_name,
            v_user_email,
            v_user_role,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 4. TRIGGER EN auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para public.users
DROP POLICY IF EXISTS "Users can read own profile and org members" ON public.users;
CREATE POLICY "Users can read own profile and org members" ON public.users
    FOR SELECT USING (
        auth.uid() = auth_user_id OR
        organization_id IN (
            SELECT u.organization_id FROM public.users u WHERE u.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (
        auth.uid() = auth_user_id
    ) WITH CHECK (
        auth.uid() = auth_user_id
    );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = auth_user_id
    );

-- Políticas para public.organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT u.organization_id FROM public.users u WHERE u.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their organization" ON public.organizations;
CREATE POLICY "Users can update their organization" ON public.organizations
    FOR UPDATE USING (
        id IN (
            SELECT u.organization_id FROM public.users u WHERE u.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- 6. SINCRONIZACIÓN RETROACTIVA (BACKFILL DE USUARIOS EXISTENTES)
DO $$
DECLARE
    r RECORD;
    v_org_id UUID;
    v_nit VARCHAR(20);
    v_company_name VARCHAR(255);
    v_first_name VARCHAR(100);
    v_last_name VARCHAR(100);
BEGIN
    FOR r IN SELECT * FROM auth.users LOOP
        v_company_name := COALESCE(
            NULLIF(TRIM(r.raw_user_meta_data->>'company_name'), ''),
            NULLIF(TRIM(r.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(r.raw_user_meta_data->>'name'), ''),
            INITCAP(REPLACE(split_part(r.email, '@', 1), '.', ' ')) || ' S.A.S.'
        );
        
        v_nit := COALESCE(
            NULLIF(TRIM(r.raw_user_meta_data->>'nit'), ''),
            'NIT-' || UPPER(SUBSTRING(r.id::text, 1, 8))
        );
        
        v_first_name := COALESCE(
            NULLIF(TRIM(r.raw_user_meta_data->>'first_name'), ''),
            NULLIF(TRIM(split_part(COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', ''), ' ', 1)), ''),
            INITCAP(split_part(r.email, '@', 1)),
            'Usuario'
        );
        
        v_last_name := COALESCE(
            NULLIF(TRIM(r.raw_user_meta_data->>'last_name'), ''),
            NULLIF(TRIM(SUBSTRING(COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', '') FROM ' .*')), ''),
            ''
        );

        -- Buscar o crear organización
        SELECT id INTO v_org_id 
        FROM public.organizations 
        WHERE nit = v_nit OR email = r.email 
        LIMIT 1;

        IF v_org_id IS NULL THEN
            INSERT INTO public.organizations (
                nit,
                name,
                email,
                is_active
            ) VALUES (
                v_nit,
                v_company_name,
                r.email,
                TRUE
            )
            ON CONFLICT (nit) DO UPDATE SET updated_at = NOW()
            RETURNING id INTO v_org_id;
        END IF;

        -- Actualizar o insertar usuario
        IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = r.id) THEN
            UPDATE public.users SET
                organization_id = v_org_id,
                first_name = v_first_name,
                last_name = v_last_name,
                email = r.email,
                role = COALESCE(NULLIF(TRIM(r.raw_user_meta_data->>'role'), ''), 'owner'),
                updated_at = NOW()
            WHERE auth_user_id = r.id;
        ELSIF EXISTS (SELECT 1 FROM public.users WHERE email = r.email) THEN
            UPDATE public.users SET
                auth_user_id = r.id,
                organization_id = v_org_id,
                first_name = v_first_name,
                last_name = v_last_name,
                role = COALESCE(NULLIF(TRIM(r.raw_user_meta_data->>'role'), ''), 'owner'),
                updated_at = NOW()
            WHERE email = r.email;
        ELSE
            INSERT INTO public.users (
                auth_user_id,
                organization_id,
                first_name,
                last_name,
                email,
                role
            ) VALUES (
                r.id,
                v_org_id,
                v_first_name,
                v_last_name,
                r.email,
                COALESCE(NULLIF(TRIM(r.raw_user_meta_data->>'role'), ''), 'owner')
            );
        END IF;

    END LOOP;
END;
$$;
