import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2, Sparkles, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';

const INPUT_STYLE = {
  background: '#0e1417',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f4f8',
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0e1417]">
      
      {/* Left Column: Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 relative overflow-hidden border-r border-white/5 bg-[#1a2123]/40 backdrop-blur-3xl">
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
            <h2 className="text-4xl lg:text-6xl font-black text-[#e8f4f8] leading-[1.1] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              Create an account. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#00ff94]">Verify your profile.</span>
            </h2>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              Register to submit geo-tagged complaints, comment on local neighborhood issues, upvote requests to gain traction, and track live repairs in your constituency.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-[#1a2123]/60 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[#00c896]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#e8f4f8] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>15-min</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Verification SLA</div>
              </div>
            </div>
            <div className="bg-[#1a2123]/60 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[#00d4ff]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#e8f4f8] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>100%</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Citizen Voice</div>
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
        <div className="w-full max-w-lg space-y-6 my-auto pt-8 pb-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-[#00d4ff] to-[#0088cc] shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#e8f4f8] tracking-tight mb-2" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
              {lang === 'ur' ? t.appNameUrdu : t.appName}
            </h1>
            <p className="mt-2 text-slate-400 text-lg">{t.register}</p>
          </div>

          <div className="rounded-3xl p-8 shadow-2xl border border-white/5 bg-[#1a2123]/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#00d4ff]/10 rounded-full blur-2xl pointer-events-none"></div>
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t.fullName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Ahmed Khan"
                  className="w-full px-4 py-3.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t.email} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ahmed@gmail.com"
                  className="w-full px-4 py-3.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Phone & CNIC in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {lang === 'ur' ? 'فون نمبر' : 'Phone Number'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="03001234567"
                    className="w-full px-4 py-3.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                    style={INPUT_STYLE}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {t.cnic}
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    placeholder="42101-XXXXXXX-X"
                    className="w-full px-4 py-3.5 text-sm rounded-xl outline-none transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Passwords in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {t.password} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 text-sm rounded-xl outline-none pr-11 transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                      style={INPUT_STYLE}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {t.confirmPassword} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 text-sm rounded-xl outline-none pr-11 transition-all focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] placeholder-slate-600"
                      style={INPUT_STYLE}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* City Area & Role in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {t.city} (District / Town) <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 text-sm rounded-xl outline-none border border-white/10"
                    style={{ background: '#0e1417', color: '#e8f4f8' }}
                  >
                    {KARACHI_AREAS.map((area) => (
                      <option key={area} value={area} className="bg-[#0e1417]">
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Account Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 text-sm rounded-xl outline-none border border-white/10"
                    style={{ background: '#0e1417', color: '#e8f4f8' }}
                  >
                    <option value="citizen" className="bg-[#0e1417]">Citizen</option>
                    <option value="admin" className="bg-[#0e1417]">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="mt-1 rounded text-[#00d4ff] bg-[#0e1417] border-white/10 w-4 h-4 focus:ring-[#00d4ff] focus:ring-offset-[#1a2123]"
                  required
                />
                <label className="text-sm cursor-pointer text-slate-300 font-medium">
                  {t.terms}
                </label>
              </div>

              {error && (
                <p className="text-sm p-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/10 font-semibold leading-relaxed">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 text-lg"
                style={{
                  background: 'linear-gradient(to right, #00d4ff, #0099cc)',
                  color: '#0e1417',
                }}
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {t.register}
              </button>
            </form>

            <p className="text-center text-sm mt-8 text-slate-400 font-medium">
              {t.alreadyHaveAccount}{' '}
              <Link to="/login" className="text-[#00D4FF] font-bold hover:text-[#00ff94] transition-colors ml-1">
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
