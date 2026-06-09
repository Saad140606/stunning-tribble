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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e1417] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #00D4FF 1.5px, transparent 1.5px)',
        backgroundSize: '30px 30px'
      }} />
      <motion.div 
        animate={{ y: [0, -25, 0], x: [0, 15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[rgba(0,212,255,0.06)] rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ y: [0, 30, 0], x: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-[rgba(139,92,246,0.06)] rounded-full blur-[120px] pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 bg-gradient-to-br from-[#00d4ff] to-[#0088cc] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-105 transition-all">
            <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[#e8f4f8] tracking-tight mb-1" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
            {lang === 'ur' ? t.appNameUrdu : t.appName}
          </h1>
          <p className="text-slate-400 text-sm">
            {lang === 'ur' ? t.taglineUrdu : t.tagline}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl p-8 shadow-2xl border border-white/5 bg-[#1a2123]/80 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#00d4ff]/10 rounded-full blur-xl pointer-events-none"></div>
          
          <motion.h2 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black mb-6 text-[#e8f4f8] tracking-tight text-center"
          >
            {t.login}
          </motion.h2>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
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
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
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
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center justify-between text-sm pt-1"
            >
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
            </motion.div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm p-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/10 leading-relaxed font-semibold"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.015, boxShadow: "0 0 20px rgba(0,212,255,0.25)" }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg"
              style={{
                background: 'linear-gradient(to right, #00d4ff, #0099cc)',
                color: '#0e1417',
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.login}
            </motion.button>
          </form>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm mt-8 text-slate-400 font-medium"
          >
            {t.dontHaveAccount}{' '}
            <Link to="/register" className="text-[#00D4FF] font-bold hover:text-[#00ff94] transition-colors ml-1">
              {t.register}
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
