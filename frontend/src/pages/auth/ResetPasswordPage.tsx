import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

const INPUT_STYLE = {
  background: '#0F2040',
  border: '1px solid rgba(0,212,255,0.18)',
  color: '#F0F4FF',
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const lang = getStoredLanguage();
  const t = translations[lang];

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token / ری سیٹ ٹوکن غائب ہے');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields / تمام خانے پُر کریں');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match / پاس ورڈز آپس میں نہیں ملتے');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters / پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          token,
          password,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password / پاس ورڈ تبدیل کرنے میں ناکامی');
      }

      setSuccess('Password updated successfully. Redirecting... / پاس ورڈ کامیابی سے تبدیل ہو گیا');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error resetting password. Please try again.');
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
            {t.resetPassword}
          </h2>

          {!token ? (
            <div className="text-center p-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/10">
              <p className="text-sm font-semibold">Missing Reset Token</p>
              <p className="text-xs mt-1">Please use the full link received in your recovery query.</p>
              <Link to="/login" className="mt-4 block text-xs underline text-[#00D4FF]">
                {t.resetLinkText}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold block" style={{ color: '#8BA3C7' }}>
                  {lang === 'ur' ? 'نیا پاس ورڈ' : 'New Password'}
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

              <div className="space-y-2">
                <label className="text-sm font-semibold block" style={{ color: '#8BA3C7' }}>
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                <p className="text-xs p-3 rounded-lg border border-green-500/20 text-green-400 bg-green-500/10">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: '#00D4FF', color: '#0A1628' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.resetPassword}
              </button>
            </form>
          )}

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
