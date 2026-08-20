import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Lock, 
  Mail, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  sendMagicLink, 
  signInWithGoogle 
} from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, isNewUser?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  const getFriendlyErrorMessage = (err: any): string => {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos. Por favor verifica tus datos.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Tu correo no ha sido confirmado aún. Por favor revisa el enlace enviado a tu bandeja de entrada.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'Ya existe una cuenta con este correo. Por favor inicia sesión.';
    }
    if (msg.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (msg.includes('rate limit')) {
      return 'Demasiados intentos. Por favor espera unos minutos antes de volver a intentar.';
    }
    return err?.message || 'Ocurrió un problema al procesar la solicitud.';
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      // Supabase redirige automáticamente al flujo OAuth de Google
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (tab === 'login') {
        const res = await signInWithEmail(email, password);
        const meta = res.user?.user_metadata || {};
        onSuccess({
          email: res.user?.email || email,
          companyName: meta.company_name,
          nit: meta.nit,
          user: res.user
        }, false);
      } else if (tab === 'signup') {
        const res = await signUpWithEmail(email, password, companyName, nit);
        onSuccess({
          email: res.user?.email || email,
          companyName: companyName,
          nit: nit,
          user: res.user
        }, true);
      } else if (tab === 'magic') {
        await sendMagicLink(email);
        setMagicSent(true);
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed top-0 left-0 w-screen h-screen z-[99999] bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 relative z-10"
        style={{
          margin: 'auto',
          maxWidth: '28rem',
          width: '100%'
        }}
      >
        
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-600/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Emotiva LicitIA
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full border border-blue-200/80 dark:border-blue-800">
                  SECOP I & II
                </span>
              </div>
              <p className="text-xs text-slate-500">Acceso a la plataforma de contratación estatal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PESTAÑAS LOGIN / REGISTRO / MAGIC LINK */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
              setMagicSent(false);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg('');
              setMagicSent(false);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              tab === 'signup'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('magic');
              setErrorMsg('');
              setMagicSent(false);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              tab === 'magic'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* MENSAJES DE ERROR / ESTADO */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1 leading-snug">{errorMsg}</span>
          </div>
        )}

        {magicSent ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
            <Mail className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-xs text-emerald-900 dark:text-emerald-200">¡Enlace Mágico Enviado!</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              Revisa tu correo corporativo ({email}) para ingresar con un solo clic sin necesidad de contraseña.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            
            {/* BOTÓN GOOGLE OAUTH (SOLO EN EL LOGIN) */}
            {tab === 'login' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-60 cursor-pointer"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                </button>

                <div className="relative flex items-center justify-center my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-950 px-3 text-[11px] font-medium text-slate-400">
                    o con correo electrónico
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* CAMPOS ESPECÍFICOS DE REGISTRO CORPORATIVO */}
              {tab === 'signup' && (
                <>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Razón Social de la Empresa
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Ej: Emotiva Tech S.A.S."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      NIT de la Empresa (Con dígito de verificación)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={nit}
                      onChange={e => setNit(e.target.value)}
                      placeholder="Ej: 901.452.890-1"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </>
              )}

              {/* CORREO ELECTRÓNICO */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  {tab === 'magic' ? 'Correo Electrónico Corporativo' : 'Correo Electrónico'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* CONTRASEÑA CON VISIBILIDAD */}
              {tab !== 'magic' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 dark:text-slate-400 font-medium">Contraseña</label>
                    {tab === 'login' && (
                      <button
                        type="button"
                        onClick={() => setTab('magic')}
                        className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* BOTÓN SUBMIT */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {tab === 'login' 
                        ? 'Iniciar Sesión' 
                        : tab === 'signup' 
                        ? 'Crear Cuenta y Comenzar Onboarding RUP' 
                        : 'Enviar Enlace Mágico'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );

  if (typeof window === 'undefined' || !mounted) return null;

  return createPortal(modalContent, document.body);
};
