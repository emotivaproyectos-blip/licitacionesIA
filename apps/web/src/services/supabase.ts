/**
 * Supabase Client & Auth Helper Service
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, companyName: string, nit: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        nit: nit,
        role: 'owner'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function sendMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  organization?: {
    id: string;
    nit: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    department?: string;
    economic_sector?: string;
  };
}

/**
 * Obtiene el perfil público del usuario desde 'public.users' y su organización
 */
export async function getUserProfile(authUserId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        auth_user_id,
        organization_id,
        first_name,
        last_name,
        email,
        role,
        created_at,
        organizations (
          id,
          nit,
          name,
          email,
          phone,
          city,
          department,
          economic_sector
        )
      `)
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      console.warn('Advertencia al consultar public.users:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      auth_user_id: data.auth_user_id,
      organization_id: data.organization_id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      role: data.role,
      created_at: data.created_at,
      organization: (data as any).organizations || undefined
    };
  } catch (err) {
    console.warn('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Sincroniza y asegura que el usuario autenticado exista en 'public.users' y 'public.organizations'
 */
export async function syncUserProfile(
  user: any,
  metaOverride?: { companyName?: string; nit?: string }
): Promise<UserProfile | null> {
  if (!user || !user.id) return null;

  try {
    // 1. Intentar obtener el perfil existente
    const existing = await getUserProfile(user.id);
    if (existing) return existing;

    // 2. Si no existe (por ejemplo mientras corre el trigger o si se usa cliente directo), asegurar registro
    const meta = user.user_metadata || {};
    const email = user.email || 'usuario@licitia.co';
    const compName = metaOverride?.companyName || meta.company_name || meta.full_name || meta.name || email.split('@')[0] + ' S.A.S.';
    const nit = metaOverride?.nit || meta.nit || ('NIT-' + user.id.substring(0, 8).toUpperCase());
    const firstName = meta.first_name || (meta.full_name ? meta.full_name.split(' ')[0] : email.split('@')[0]) || 'Usuario';
    const lastName = meta.last_name || (meta.full_name ? meta.full_name.substring(meta.full_name.indexOf(' ') + 1) : '') || '';

    // Buscar o crear organización
    let orgId: string | null = null;
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .or(`nit.eq.${nit},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (orgData?.id) {
      orgId = orgData.id;
    } else {
      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          nit,
          name: compName,
          email,
          is_active: true
        })
        .select('id')
        .single();

      if (!orgErr && newOrg) {
        orgId = newOrg.id;
      }
    }

    if (orgId) {
      const { data: newUser, error: userErr } = await supabase
        .from('users')
        .upsert({
          auth_user_id: user.id,
          organization_id: orgId,
          first_name: firstName,
          last_name: lastName,
          email,
          role: meta.role || 'owner',
          updated_at: new Date().toISOString()
        }, { onConflict: 'auth_user_id' })
        .select()
        .single();

      if (!userErr && newUser) {
        return getUserProfile(user.id);
      }
    }

    return null;
  } catch (err) {
    console.warn('Error syncing user profile:', err);
    return null;
  }
}

