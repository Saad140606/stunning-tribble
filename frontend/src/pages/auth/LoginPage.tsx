import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2, Award, Users, CheckCircle, Flame } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12" style={{ background: '#0A1628' }}>
      {/* Left Column: Branding Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 relative overflow-hidden border-r border-[rgba(0,212,255,0.08)]">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, #00D4FF 1.5px, transparent 1.5px)',
          backgroundSize: '30px 30px'
        }} />
        
        {/* Decorative Neon Swirls */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[rgba(0,212,255,0.08)] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[rgba(139,92,246,0.08)] rounded-full blur-3xl" />

        {/* Top Header info */}
        <div className="z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00D4FF]">
            <ShieldCheck className="w-5 h-5 text-[#0A1628]" />
          </div>
          <span className="text-sm font-extrabold text-white uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
            Fix Karachi
          </span>
        </div>

        {/* Middle Callout */}
        <div className="z-10 my-auto max-w-lg space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-extrabold text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              Empowering citizens. <br />
              <span className="text-[#00D4FF]">Fixing our city together.</span>
            </h2>
            <p className="mt-4 text-base text-[#8BA3C7] leading-relaxed">
              Fix Karachi is a community-driven PWA allowing Karachiites to report local infrastructure issues directly to KMC. Built with advanced AI tagging, duplicate detection, and live status heatmaps.
            </p>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-[#0F2040] border border-[rgba(0,212,255,0.08)] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#00C896]" />
              <div>
                <div className="text-lg font-bold text-white font-mono">1,824+</div>
                <div className="text-[10px] text-[#4A6080] font-semibold uppercase tracking-wider">Issues Fixed</div>
              </div>
            </div>
            <div className="bg-[#0F2040] border border-[rgba(0,212,255,0.08)] p-4 rounded-xl flex items-center gap-3">
              <Users className="w-6 h-6 text-[#00D4FF]" />
              <div>
                <div className="text-lg font-bold text-white font-mono">10,250</div>
                <div className="text-[10px] text-[#4A6080] font-semibold uppercase tracking-wider">Citizens Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 flex justify-between items-center text-xs text-[#4A6080] pt-4">
          <span>© 2026 Karachi Metropolitan Corporation</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* Right Column: Form Panel (Span 6) */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-[#00D4FF]">
              <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
            </div>
            <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              {lang === 'ur' ? t.appNameUrdu : t.appName}
            </h1>
            <p className="mt-1.5 text-sm text-[#8BA3C7]">
              {lang === 'ur' ? t.taglineUrdu : t.tagline}
            </p>
          </div>

          <div className="rounded-2xl p-6 shadow-2xl border border-[rgba(0,212,255,0.06)] bg-[#0F2040]">
            <h2 className="text-xl font-bold mb-6 text-white text-center">
              {t.login}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@karachi.gov"
                  className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                  {t.password}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-sm rounded-xl outline-none pr-11 transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]"
                    style={INPUT_STYLE}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 focus:outline-none"
                    style={{ color: '#8BA3C7' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#8BA3C7] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-[#00D4FF] h-4 w-4 bg-[#0F2040]"
                  />
                  {t.rememberMe}
                </label>
                <Link to="/forgot-password" className="text-[#00D4FF] font-semibold hover:underline">
                  {t.forgotPasswordLink}
                </Link>
              </div>

              {error && (
                <p className="text-xs p-3 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 leading-relaxed font-semibold">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-105 shadow-md text-sm"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
                  color: '#0A1628',
                  boxShadow: '0 4px 14px rgba(0,212,255,0.2)'
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.login}
              </button>
            </form>

            <p className="text-center text-xs mt-6 text-[#8BA3C7]">
              {t.dontHaveAccount}{' '}
              <Link to="/register" className="text-[#00D4FF] font-bold hover:underline">
                {t.register}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
