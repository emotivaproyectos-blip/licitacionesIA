-- =============================================================================
-- MIGRACIÓN SQL: MÓDULO DE SUSCRIPCIONES Y PAGOS WOMPI BANCOLOMBIA
-- Plataforma SaaS Emotiva LicitIA (PostgreSQL + Supabase + RLS)
-- =============================================================================

-- 1. TABLA: SUBSCRIPTIONS (Suscripciones SaaS por Organización)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'pyme', 'enterprise'
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trialing'
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    payment_method VARCHAR(50), -- 'PSE', 'CARD', 'NEQUI', 'BANCOLOMBIA'
    wompi_transaction_id VARCHAR(100),
    wompi_reference VARCHAR(150),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_subscriptions_organization UNIQUE (organization_id)
);

COMMENT ON TABLE public.subscriptions IS 'Almacena el estado de suscripción y vigencia de cada empresa/organización en LicitIA';
COMMENT ON COLUMN public.subscriptions.plan_id IS 'free (Explorador RUP), pyme (Pyme Contratista), enterprise (Enterprise Consorcios)';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'Fecha y hora exacta en la que vence el periodo pagado';

-- 2. TABLA: PAYMENT_TRANSACTIONS (Historial de Pagos de Wompi)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    reference VARCHAR(150) NOT NULL,
    wompi_id VARCHAR(100),
    amount_in_cents BIGINT NOT NULL,
    amount_cop NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    status VARCHAR(50) NOT NULL, -- 'APPROVED', 'DECLINED', 'VOIDED', 'PENDING', 'ERROR'
    payment_method_type VARCHAR(50), -- 'CARD', 'NEQUI', 'PSE', 'BANCOLOMBIA'
    plan_id VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    customer_email VARCHAR(255),
    customer_data JSONB DEFAULT '{}'::jsonb,
    raw_event JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payment_transactions IS 'Registro auditable de todas las transacciones procesadas por la pasarela Wompi';

-- 3. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_org ON public.payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_ref ON public.payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_wompi_id ON public.payment_transactions(wompi_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- 4. TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
DROP TRIGGER IF EXISTS trg_update_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_update_subscriptions 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_payment_transactions ON public.payment_transactions;
CREATE TRIGGER trg_update_payment_transactions 
    BEFORE UPDATE ON public.payment_transactions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 5.1 Suscripciones: Los usuarios autenticados pueden ver la suscripción de su propia organización
DROP POLICY IF EXISTS "Users can view their organization subscription" ON public.subscriptions;
CREATE POLICY "Users can view their organization subscription" ON public.subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT u.organization_id FROM public.users u WHERE u.auth_user_id = auth.uid()
        )
    );

-- 5.2 Historial de pagos: Los usuarios pueden ver los pagos de su propia organización
DROP POLICY IF EXISTS "Users can view their organization transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their organization transactions" ON public.payment_transactions
    FOR SELECT USING (
        organization_id IN (
            SELECT u.organization_id FROM public.users u WHERE u.auth_user_id = auth.uid()
        )
    );

-- 5.3 El backend con 'service_role' tiene control total (lectura, inserción y actualización)
DROP POLICY IF EXISTS "Service role has full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Service role has full access to subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role has full access to transactions" ON public.payment_transactions;
CREATE POLICY "Service role has full access to transactions" ON public.payment_transactions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 6. FUNCIÓN AUXILIAR: Obtener plan activo o free si expiró
CREATE OR REPLACE FUNCTION public.get_organization_active_plan(p_organization_id UUID)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan VARCHAR(50);
BEGIN
    SELECT plan_id INTO v_plan
    FROM public.subscriptions
    WHERE organization_id = p_organization_id
      AND status = 'active'
      AND current_period_end > NOW()
    LIMIT 1;

    RETURN COALESCE(v_plan, 'free');
END;
$$;
