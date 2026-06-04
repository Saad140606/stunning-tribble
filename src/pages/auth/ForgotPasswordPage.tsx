import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Loader2 } from 'lucide-react';

const INPUT_STYLE = {
  background: '#0F2040',
  border: '1px solid rgba(0,212,255,0.18)',
  color: '#F0F4FF',
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
          <h2 className="text-xl font-bold mb-4 text-center" style={{ color: '#F0F4FF' }}>
            {t.forgotPassword}
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

            {error && (
              <p className="text-xs p-3 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10">
                {error}
              </p>
            )}

            {success && (
              <div className="text-xs p-3 rounded-lg border border-green-500/20 text-green-400 bg-green-500/10 space-y-2">
                <p>{success}</p>
                {resetLink && (
                  <div className="mt-2 p-2 rounded bg-black/30 border border-green-500/20">
                    <p className="font-semibold text-xxs text-slate-400 mb-1">Local reset URL (for hackathon preview):</p>
                    <a href={resetLink} className="underline text-[#00D4FF] break-all block">{resetLink}</a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: '#00D4FF', color: '#0A1628' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === 'ur' ? 'پاس ورڈ دوبارہ حاصل کریں' : 'Recover Password'}
            </button>
          </form>

          <p className="text-center text-xs mt-6">
            <Link to="/login" style={{ color: '#00D4FF', fontWeight: 'bold' }}>
              {t.resetLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
