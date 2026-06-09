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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e1417] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #00D4FF 1.5px, transparent 1.5px)',
        backgroundSize: '30px 30px'
      }} />
      <motion.div 
        animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[rgba(0,212,255,0.06)] rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ y: [0, 25, 0], x: [0, -15, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-[rgba(139,92,246,0.06)] rounded-full blur-[120px] pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl space-y-6 relative z-10 my-auto pt-8 pb-8"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 bg-gradient-to-br from-[#00d4ff] to-[#0088cc] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-105 transition-all">
            <ShieldCheck className="w-8 h-8 text-[#0A1628]" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[#e8f4f8] tracking-tight mb-1" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
            {lang === 'ur' ? t.appNameUrdu : t.appName}
          </h1>
          <p className="text-slate-400 text-sm">
            {t.register}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl p-8 shadow-2xl border border-white/5 bg-[#1a2123]/80 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#00d4ff]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Full Name */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="space-y-2"
            >
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
            </motion.div>

            {/* Email Address */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="space-y-2"
            >
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
            </motion.div>

            {/* Phone & CNIC in Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
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
            </motion.div>

            {/* Passwords in Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
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
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-1.5 space-y-1"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#4A6080]">Password Strength:</span>
                      <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                    </div>
                    <div className="h-1 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden flex gap-0.5">
                      <motion.div 
                        className="h-full rounded-l-full" 
                        animate={{ 
                          width: strength.score >= 1 ? '33.3%' : '0%',
                          backgroundColor: strength.color 
                        }}
                        transition={{ type: 'spring', stiffness: 80 }}
                      />
                      <motion.div 
                        className="h-full" 
                        animate={{ 
                          width: strength.score >= 2 ? '33.3%' : '0%',
                          backgroundColor: strength.color 
                        }}
                        transition={{ type: 'spring', stiffness: 80 }}
                      />
                      <motion.div 
                        className="h-full rounded-r-full" 
                        animate={{ 
                          width: strength.score >= 3 ? '33.4%' : '0%',
                          backgroundColor: strength.color 
                        }}
                        transition={{ type: 'spring', stiffness: 80 }}
                      />
                    </div>
                  </motion.div>
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
            </motion.div>

            {/* City Area & Role in Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
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
            </motion.div>

            {/* Terms Checkbox */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="flex items-start gap-3 pt-2"
            >
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
            </motion.div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm p-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/10 font-semibold leading-relaxed"
              >
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.015, boxShadow: "0 0 20px rgba(0,212,255,0.25)" }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg"
              style={{
                background: 'linear-gradient(to right, #00d4ff, #0099cc)',
                color: '#0e1417',
              }}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t.register}
            </motion.button>
          </form>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="text-center text-sm mt-8 text-slate-400 font-medium"
          >
            {t.alreadyHaveAccount}{' '}
            <Link to="/login" className="text-[#00D4FF] font-bold hover:text-[#00ff94] transition-colors ml-1">
              {t.login}
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
