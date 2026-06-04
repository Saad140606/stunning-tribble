import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

const INPUT_STYLE = {
  background: '#0F2040',
  border: '1px solid rgba(0,212,255,0.18)',
  color: '#F0F4FF',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const lang = getStoredLanguage();
  const t = translations[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields / براہ کرم تمام خانوں کو پُر کریں');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen px-5 py-8 flex items-center justify-center" style={{ background: '#0A1628' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: '#00D4FF' }}>
            <ShieldCheck className="w-9 h-9" style={{ color: '#0A1628' }} />
          </div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans'", color: '#F0F4FF' }}>
            {lang === 'ur' ? t.appNameUrdu : t.appName}
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8BA3C7' }}>
            {lang === 'ur' ? t.taglineUrdu : t.tagline}
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: '#F0F4FF' }}>
            {t.login}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold block" style={{ color: '#8BA3C7' }}>
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@karachi.gov"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={INPUT_STYLE}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block" style={{ color: '#8BA3C7' }}>
                {t.password}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl outline-none pr-10"
                  style={INPUT_STYLE}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 focus:outline-none"
                  style={{ color: '#8BA3C7' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#8BA3C7' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-[#00D4FF]"
                />
                {t.rememberMe}
              </label>
              <Link to="/forgot-password" style={{ color: '#00D4FF' }}>
                {t.forgotPasswordLink}
              </Link>
            </div>

            {error && (
              <p className="text-xs p-3 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: '#00D4FF', color: '#0A1628' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.login}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#8BA3C7' }}>
            {t.dontHaveAccount}{' '}
            <Link to="/register" style={{ color: '#00D4FF', fontWeight: 'bold' }}>
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
