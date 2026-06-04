import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, getStoredLanguage } from '../../components/translations';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

const INPUT_STYLE = {
  background: '#0F2040',
  border: '1px solid rgba(0,212,255,0.18)',
  color: '#F0F4FF',
};

// Seed districts/cities list in Karachi
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
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field checks
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
        role: 'citizen'
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-5 py-8 flex items-center justify-center" style={{ background: '#0A1628' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: '#00D4FF' }}>
            <ShieldCheck className="w-8 h-8" style={{ color: '#0A1628' }} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans'", color: '#F0F4FF' }}>
            {lang === 'ur' ? t.appNameUrdu : t.appName}
          </h1>
          <p className="text-xs" style={{ color: '#8BA3C7' }}>{t.register}</p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                {t.fullName} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ahmed Khan"
                className="w-full px-4 py-2 text-sm rounded-xl outline-none"
                style={INPUT_STYLE}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                {t.email} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ahmed@gmail.com"
                className="w-full px-4 py-2 text-sm rounded-xl outline-none"
                style={INPUT_STYLE}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                  {lang === 'ur' ? 'فون نمبر' : 'Phone Number'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="03001234567"
                  className="w-full px-4 py-2 text-sm rounded-xl outline-none"
                  style={INPUT_STYLE}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                  {t.cnic}
                </label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  placeholder="42101-XXXXXXX-X"
                  className="w-full px-4 py-2 text-sm rounded-xl outline-none"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                  {t.password} <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••"
                    className="w-full px-4 py-2 text-sm rounded-xl outline-none pr-8"
                    style={INPUT_STYLE}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2"
                    style={{ color: '#8BA3C7' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                  {t.confirmPassword} <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••"
                    className="w-full px-4 py-2 text-sm rounded-xl outline-none pr-8"
                    style={INPUT_STYLE}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2"
                    style={{ color: '#8BA3C7' }}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold block" style={{ color: '#8BA3C7' }}>
                {t.city} (District / Town) <span className="text-red-400">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm rounded-xl outline-none"
                style={INPUT_STYLE}
              >
                {KARACHI_AREAS.map((area) => (
                  <option key={area} value={area} className="bg-[#0F2040]">
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="mt-0.5 rounded accent-[#00D4FF]"
                required
              />
              <label className="text-xxs cursor-pointer" style={{ color: '#8BA3C7' }}>
                {t.terms}
              </label>
            </div>

            {error && (
              <p className="text-xxs p-2 rounded border border-red-500/20 text-red-400 bg-red-500/10">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 text-sm"
              style={{ background: '#00D4FF', color: '#0A1628' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.register}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: '#8BA3C7' }}>
            {t.alreadyHaveAccount}{' '}
            <Link to="/login" style={{ color: '#00D4FF', fontWeight: 'bold' }}>
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
