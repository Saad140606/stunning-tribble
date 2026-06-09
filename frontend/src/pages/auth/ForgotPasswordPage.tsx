import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const INPUT_STYLE = {
  background: '#0e1417',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f4f8',
};

export function ForgotPasswordPage() {
  const lang = getStoredLanguage();
  const t = translations[lang];

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetLink('');

    if (!email) {
      setError('Please enter your email / براہ کرم ای میل درج کریں');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request reset / درخواست نامکمل رہی');
      }

      setSuccess('Reset link generated successfully / پاس ورڈ دوبارہ ترتیب دینے کا لنک جاری ہو گیا');
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e1417] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #00D4FF 1.5px, transparent 1.5px)',
        backgroundSize: '30px 30px'
      }} />
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[320px] h-[320px] bg-[rgba(0,212,255,0.06)] rounded-full blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{ y: [0, 20, 0], x: [0, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[320px] h-[320px] bg-[rgba(139,92,246,0.05)] rounded-full blur-[100px] pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 bg-gradient-to-br from-[#00d4ff] to-[#0088cc] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-105 transition-all">
            <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
          </Link>
          <h1 className="text-3xl font-black text-[#e8f4f8] tracking-tight mb-1" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
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
            {t.forgotPassword}
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

            {error && (
              <motion.p 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm p-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/10 leading-relaxed font-semibold"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm p-4 rounded-xl border border-green-500/20 text-green-400 bg-green-500/10 space-y-3 font-semibold leading-relaxed"
              >
                <p>{success}</p>
                {resetLink && (
                  <div className="mt-2 p-3 rounded-lg bg-black/40 border border-green-500/20 font-mono text-xxs leading-normal font-normal">
                    <p className="font-semibold text-slate-400 mb-1">Local reset URL (for hackathon preview):</p>
                    <a href={resetLink} className="underline text-[#00D4FF] break-all block">{resetLink}</a>
                  </div>
                )}
              </motion.div>
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
              {lang === 'ur' ? 'پاس ورڈ دوبارہ حاصل کریں' : 'Recover Password'}
            </motion.button>
          </form>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-center text-sm mt-8 text-slate-400 font-medium"
          >
            <Link to="/login" className="text-[#00D4FF] font-bold hover:text-[#00ff94] transition-colors">
              {t.resetLinkText}
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
