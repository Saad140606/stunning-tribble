import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2, Sparkles, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';

const INPUT_STYLE = {
  background: '#0F2040',
  border: '1px solid rgba(0,212,255,0.18)',
  color: '#F0F4FF',
};

const KARACHI_AREAS = [
  'Saddar', 'Clifton', 'Gulshan-e-Iqbal', 'PECHS', 'Korangi', 
  'Malir', 'Nazimabad', 'Lyari', 'North Karachi', 'DHA', 
  'Federal B Area', 'Orangi Town', 'Gulistan-e-Johar', 'SITE Area'
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const lang = getStoredLanguage();
  const t = translations[lang];

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    confirm_password: '',
    city: 'Saddar',
    role: 'citizen',
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Password Strength State
  const [strength, setStrength] = useState({ score: 0, label: '', color: '#FF3B3B' });

  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '#FF3B3B' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) && pass.length >= 8) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: '#FF3B3B' };
    if (score === 2) return { score: 2, label: 'Medium', color: '#FFB800' };
    return { score: 3, label: 'Strong', color: '#00C896' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'password') {
        setStrength(calculateStrength(value));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name || !formData.email || !formData.phone || !formData.password || !formData.confirm_password || !formData.city) {
      setError('Please fill all required fields / تمام مطلوبہ خانے پُر کریں');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match / پاس ورڈز آپس میں نہیں ملتے');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters / پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے');
      return;
    }

    if (!formData.terms) {
      setError('Please accept terms and conditions / براہ کرم شرائط و ضوابط تسلیم کریں');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        cnic: formData.cnic || undefined,
        password: formData.password,
        confirm_password: formData.confirm_password,
        city: formData.city,
        role: formData.role
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12" style={{ background: '#0A1628' }}>
      
      {/* Left Column: Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 relative overflow-hidden border-r border-[rgba(0,212,255,0.08)]">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, #00D4FF 1.5px, transparent 1.5px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[rgba(0,212,255,0.08)] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[rgba(139,92,246,0.08)] rounded-full blur-3xl" />

        <div className="z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00D4FF]">
            <ShieldCheck className="w-5 h-5 text-[#0A1628]" />
          </div>
          <span className="text-sm font-extrabold text-white uppercase tracking-wider">
            Fix Karachi
          </span>
        </div>

        <div className="z-10 my-auto max-w-lg space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Create an account. <br />
              <span className="text-[#00D4FF]">Verify your profile.</span>
            </h2>
            <p className="mt-4 text-base text-[#8BA3C7] leading-relaxed">
              Register to submit geo-tagged complaints, comment on local neighborhood issues, upvote requests to gain traction, and track live repairs in your constituency.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-[#0F2040] border border-[rgba(0,212,255,0.08)] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#00C896]" />
              <div>
                <div className="text-lg font-bold text-white font-mono">15-min</div>
                <div className="text-[10px] text-[#4A6080] font-semibold uppercase tracking-wider">Verification SLA</div>
              </div>
            </div>
            <div className="bg-[#0F2040] border border-[rgba(0,212,255,0.08)] p-4 rounded-xl flex items-center gap-3">
              <Users className="w-6 h-6 text-[#00D4FF]" />
              <div>
                <div className="text-lg font-bold text-white font-mono">100%</div>
                <div className="text-[10px] text-[#4A6080] font-semibold uppercase tracking-wider">Citizen Voice</div>
              </div>
            </div>
          </div>
        </div>

        <div className="z-10 flex justify-between items-center text-xs text-[#4A6080]">
          <span>© 2026 Karachi Metropolitan Corporation</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right Column: Register Form (Span 6) */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 my-auto">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-[#00D4FF]">
              <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
            </div>
            <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              {lang === 'ur' ? t.appNameUrdu : t.appName}
            </h1>
            <p className="mt-1.5 text-sm text-[#8BA3C7]">{t.register}</p>
          </div>

          <div className="rounded-2xl p-6 shadow-2xl border border-[rgba(0,212,255,0.06)] bg-[#0F2040]">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                  {t.fullName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Ahmed Khan"
                  className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF]"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                  {t.email} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ahmed@gmail.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF]"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Phone & CNIC in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                    {lang === 'ur' ? 'فون نمبر' : 'Phone Number'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="03001234567"
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF]"
                    style={INPUT_STYLE}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                    {t.cnic}
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    placeholder="42101-XXXXXXX-X"
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF]"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Passwords in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                    {t.password} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••"
                      className="w-full px-4 py-2.5 text-sm rounded-xl outline-none pr-10 transition-all focus:border-[#00D4FF]"
                      style={INPUT_STYLE}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3"
                      style={{ color: '#8BA3C7' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Strength Bar */}
                  {formData.password && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#4A6080]">Password Strength:</span>
                        <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden flex gap-0.5">
                        <div className="h-full rounded-l-full transition-all" style={{ width: strength.score >= 1 ? '33.3%' : '0%', background: strength.color }} />
                        <div className="h-full transition-all" style={{ width: strength.score >= 2 ? '33.3%' : '0%', background: strength.color }} />
                        <div className="h-full rounded-r-full transition-all" style={{ width: strength.score >= 3 ? '33.4%' : '0%', background: strength.color }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                    {t.confirmPassword} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••"
                      className="w-full px-4 py-2.5 text-sm rounded-xl outline-none pr-10 transition-all focus:border-[#00D4FF]"
                      style={INPUT_STYLE}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3"
                      style={{ color: '#8BA3C7' }}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* City Area & Role in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                    {t.city} (District / Town) <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none border border-[rgba(0,212,255,0.18)]"
                    style={{ background: '#0F2040', color: '#F0F4FF' }}
                  >
                    {KARACHI_AREAS.map((area) => (
                      <option key={area} value={area} className="bg-[#0F2040]">
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8BA3C7] block">
                    Account Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none border border-[rgba(0,212,255,0.18)]"
                    style={{ background: '#0F2040', color: '#F0F4FF' }}
                  >
                    <option value="citizen" className="bg-[#0F2040]">Citizen</option>
                    <option value="admin" className="bg-[#0F2040]">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="mt-0.5 rounded accent-[#00D4FF] h-4 w-4 bg-[#0F2040]"
                  required
                />
                <label className="text-[11px] cursor-pointer text-[#8BA3C7]" style={{ lineHeight: '1.4' }}>
                  {t.terms}
                </label>
              </div>

              {error && (
                <p className="text-xs p-3 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 font-semibold leading-relaxed">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-105 shadow-md text-sm"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
                  color: '#0A1628',
                  boxShadow: '0 4px 14px rgba(0,212,255,0.2)'
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.register}
              </button>
            </form>

            <p className="text-center text-xs mt-6 text-[#8BA3C7]">
              {t.alreadyHaveAccount}{' '}
              <Link to="/login" className="text-[#00D4FF] font-bold hover:underline">
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
