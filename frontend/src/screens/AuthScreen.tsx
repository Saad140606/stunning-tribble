import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { Loader2, ShieldCheck } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../lib/firebase';

const INPUT_STYLE: React.CSSProperties = {
  background: '#0F2040',
  border: '1px solid rgba(0,212,255,0.18)',
  color: '#F0F4FF',
};

export function AuthScreen() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const [shake, setShake] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const fullPhone = useMemo(() => `+92${phone.replace(/^0/, '')}`, [phone]);

  useEffect(() => {
    if (!confirmation || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [confirmation, seconds]);

  const ensureRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
    return recaptchaRef.current;
  };

  const isValidPhone = /^03\d{9}$/.test(phone);

  const sendOtp = async () => {
    setError('');
    if (!isValidPhone) {
      setError('Please enter a valid Pakistani number / درست پاکستانی نمبر درج کریں');
      return;
    }
    if (!isFirebaseConfigured) {
      setError('Firebase env vars are missing. Add .env.local values and enable Phone Auth in Firebase Console.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, fullPhone, ensureRecaptcha());
      setConfirmation(result);
      setSeconds(30);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    setLoading(true);
    setError('');
    try {
      await confirmation.confirm(otp.join(''));
      navigate('/', { replace: true });
    } catch {
      setShake(true);
      setError('Invalid OTP. Please check the code and try again.');
      setTimeout(() => setShake(false), 450);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  return (
    <div className="min-h-screen px-5 py-8 flex items-center justify-center" style={{ background: '#0A1628' }}>
      <style>{`
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: '#00D4FF' }}>
            <ShieldCheck className="w-9 h-9" style={{ color: '#0A1628' }} />
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 28, fontWeight: 800, color: '#F0F4FF' }}>
            Fix Karachi
          </h1>
          <p className="mt-2" style={{ color: '#8BA3C7' }}>Secure civic access with phone OTP</p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          {!confirmation ? (
            <div className="space-y-4">
              <label style={{ color: '#F0F4FF', fontWeight: 700 }}>Pakistani mobile number</label>
              <div className="flex overflow-hidden rounded-xl" style={INPUT_STYLE}>
                <span className="px-4 py-3" style={{ color: '#00D4FF', borderRight: '1px solid rgba(0,212,255,0.12)' }}>+92</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="03XXXXXXXXX"
                  className="flex-1 px-4 py-3 outline-none"
                  style={{ background: 'transparent', color: '#F0F4FF' }}
                />
              </div>
              {error && <p style={{ color: '#FF6B35', fontSize: 13 }}>{error}</p>}
              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ background: '#00D4FF', color: '#0A1628' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send OTP / OTP بھیجیں
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <p style={{ color: '#8BA3C7' }}>Enter the 6-digit code sent to {fullPhone}</p>
              <div className="grid grid-cols-6 gap-2" style={{ animation: shake ? 'otpShake 0.35s ease' : undefined }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputsRef.current[index] = el; }}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !otp[index] && index > 0) inputsRef.current[index - 1]?.focus();
                    }}
                    className="h-12 text-center rounded-xl outline-none"
                    style={INPUT_STYLE}
                    inputMode="numeric"
                  />
                ))}
              </div>
              {error && <p style={{ color: '#FF6B35', fontSize: 13 }}>{error}</p>}
              <button
                onClick={verifyOtp}
                disabled={loading || otp.some((digit) => !digit)}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ background: '#00D4FF', color: '#0A1628', opacity: otp.some((digit) => !digit) ? 0.6 : 1 }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify / تصدیق کریں
              </button>
              {seconds > 0 ? (
                <p className="text-center" style={{ color: '#4A6080' }}>Resend OTP in {seconds}s</p>
              ) : (
                <button onClick={sendOtp} className="w-full text-sm" style={{ color: '#00D4FF' }}>Resend OTP</button>
              )}
            </div>
          )}
        </div>

        <Link to="/transparency" className="block text-center mt-5" style={{ color: '#00D4FF' }}>
          View City Dashboard →
        </Link>
      </div>
      <div id="recaptcha-container" />
    </div>
  );
}

