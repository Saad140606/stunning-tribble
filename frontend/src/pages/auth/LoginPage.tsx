import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2, Award, Users, CheckCircle, Flame } from 'lucide-react';
import { motion } from 'motion/react';

const INPUT_STYLE = {
  background: '#0e1417',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f4f8',
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
    <div className="min-h-screen flex bg-[#0e1417]">
      {/* Left Column: Branding Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden border-r border-white/5 bg-[#1a2123]/40 backdrop-blur-3xl">
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
            <h2 className="text-4xl lg:text-6xl font-black text-[#e8f4f8] leading-[1.1] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              Empowering citizens. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#00ff94]">Fixing our city together.</span>
            </h2>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              Fix Karachi is a community-driven PWA allowing Karachiites to report local infrastructure issues directly to KMC. Built with advanced AI tagging, duplicate detection, and live status heatmaps.
            </p>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-[#1a2123]/60 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[#00c896]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#e8f4f8] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>1,824+</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Issues Fixed</div>
              </div>
            </div>
            <div className="bg-[#1a2123]/60 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[#00d4ff]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#e8f4f8] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>10,250</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Citizens Active</div>
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-[#00d4ff] to-[#0088cc] shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#e8f4f8] tracking-tight mb-2" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              {lang === 'ur' ? t.appNameUrdu : t.appName}
            </h1>
            <p className="mt-2 text-slate-400 text-lg">
              {lang === 'ur' ? t.taglineUrdu : t.tagline}
            </p>
          </div>

          <div className="rounded-3xl p-8 shadow-2xl border border-white/5 bg-[#1a2123]/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#00d4ff]/10 rounded-full blur-2xl"></div>
            
            <h2 className="text-2xl font-black mb-6 text-[#e8f4f8] tracking-tight">
              {t.login}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@karachi.gov"
                  className="w-full px-4 py-3.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t.password}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 text-sm rounded-xl outline-none pr-11 transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                    style={INPUT_STYLE}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 focus:outline-none text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#00d4ff] bg-[#0e1417] border-white/10 w-4 h-4 focus:ring-[#00d4ff] focus:ring-offset-[#1a2123]"
                  />
                  {t.rememberMe}
                </label>
                <Link to="/forgot-password" className="text-[#00D4FF] font-bold hover:text-[#00ff94] transition-colors">
                  {t.forgotPasswordLink}
                </Link>
              </div>

              {error && (
                <p className="text-sm p-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/10 leading-relaxed font-semibold">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 text-lg"
                style={{
                  background: 'linear-gradient(to right, #00d4ff, #0099cc)',
                  color: '#0e1417',
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.login}
              </button>
            </form>

            <p className="text-center text-sm mt-8 text-slate-400 font-medium">
              {t.dontHaveAccount}{' '}
              <Link to="/register" className="text-[#00D4FF] font-bold hover:text-[#00ff94] transition-colors ml-1">
                {t.register}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
