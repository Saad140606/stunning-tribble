import React, { useEffect, useState } from 'react';
import { Camera, MapPin, X, Check, ChevronRight, ChevronLeft, Zap, Trash2, Lightbulb, Droplets, AlertTriangle, Sparkles, Award, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutMode, Report, User } from '../App';
import { translations } from './translations';
import confetti from 'canvas-confetti';
import { useRateLimit } from '../hooks/useRateLimit';
import { DuplicateCandidate, findPotentialDuplicate } from '../utils/duplicateDetection';
import { createImageBlurhash } from '../utils/imageHash';
import { useAuth } from '../context/AuthContext';

// Deterministic AI confidence score using keyword matching
function getAIConfidence(category: string, title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  const keywordMap: Record<string, string[]> = {
    pothole: ['pothole', 'road', 'damage', 'crack', 'hole', 'asphalt', 'pavement'],
    garbage: ['garbage', 'trash', 'waste', 'dump', 'bin', 'overflow', 'litter'],
    streetlight: ['light', 'lamp', 'dark', 'electricity', 'pole', 'bulb', 'outage'],
    water: ['water', 'pipe', 'leak', 'supply', 'shortage', 'burst', 'leakage'],
    sewerage: ['sewer', 'sewage', 'drain', 'manhole', 'overflow', 'smell', 'stench'],
    safety: ['robbery', 'theft', 'unsafe', 'danger', 'harassment', 'crime', 'threat'],
  };
  const keywords = keywordMap[category] || [];
  const matches = keywords.filter(k => text.includes(k)).length;
  const base = 70;
  const boost = Math.min(matches * 5, 25);
  return base + boost + (category ? 3 : 0);
}

// Fallback district lookup when Nominatim fails
function getNearestDistrict(lat: number, lng: number): string {
  const districts: Record<string, [number, number]> = {
    'Saddar': [24.8553, 67.0104], 'Clifton': [24.8042, 67.0239],
    'Gulshan-e-Iqbal': [24.9166, 67.0942], 'North Nazimabad': [24.9302, 67.0434],
    'Korangi': [24.8392, 67.1155], 'Malir': [24.8904, 67.2102],
    'Lyari': [24.8596, 67.0033], 'Kemari': [24.8283, 66.9861],
    'PECHS': [24.8750, 67.0594], 'Defence': [24.8140, 67.0686],
  };
  let nearest = 'Karachi';
  let minDist = Infinity;
  for (const [name, [dlat, dlng]] of Object.entries(districts)) {
    const d = Math.sqrt((lat - dlat) ** 2 + (lng - dlng) ** 2);
    if (d < minDist) { minDist = d; nearest = name; }
  }
  return nearest;
}

interface ReportScreenProps {
  user: User;
  layoutMode?: LayoutMode;
  onSubmit: (report: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'>) => void;
  onCancel: () => void;
}

const categories = [
  { value: 'pothole', color: '#FF6B35', LucideIcon: AlertTriangle },
  { value: 'garbage', color: '#00C896', LucideIcon: Trash2 },
  { value: 'streetlight', color: '#FFB800', LucideIcon: Lightbulb },
  { value: 'water', color: '#00D4FF', LucideIcon: Droplets },
  { value: 'sewerage', color: '#8B5CF6', LucideIcon: Zap },
  { value: 'safety', color: '#FF3B3B', LucideIcon: AlertTriangle },
];

export function ReportScreen({ user, layoutMode = 'mobile', onSubmit, onCancel }: ReportScreenProps) {
  const { user: authUser } = useAuth();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateCandidate | null>(null);
  const [submitAnyway, setSubmitAnyway] = useState(false);
  const rateLimit = useRateLimit();
  const [location, setLocation] = useState<{lat: number, lng: number, ward: string, district: string} | null>(null);
  const [severity, setSeverity] = useState(7);

  const t = translations[user.language];

  // Reverse geocoding
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const ward = addr.suburb || addr.neighbourhood || addr.quarter || addr.town || 'Unknown Area';
          const district = addr.city_district || addr.county || addr.state_district || 'Karachi';
          setLocation({ lat: latitude, lng: longitude, ward, district });
        } catch {
          const district = getNearestDistrict(latitude, longitude);
          setLocation({ lat: latitude, lng: longitude, ward: district, district: 'Karachi' });
        }
      },
      () => {
        setLocation({
          lat: user.coordinates.lat,
          lng: user.coordinates.lng,
          ward: user.district,
          district: 'Karachi',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [user.coordinates, user.district]);

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCapturedPhoto(event.target?.result as string);
        };
        reader.readAsDataURL(target.files[0]);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!category || !location) return;
    if (rateLimit.isLimited) return;

    const catInfo = categories.find(c => c.value === category);
    const coordinates = {
      lat: location.lat,
      lng: location.lng,
    };

    if (!duplicate && !submitAnyway) {
      const match = await findPotentialDuplicate({ category, ...coordinates });
      if (match) {
        setDuplicate(match);
        return;
      }
    }

    const blurhash = capturedPhoto ? await createImageBlurhash(capturedPhoto) : null;

    const newReport: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'> = {
      title: title || `${catInfo?.value || 'Issue'} reported`,
      description: description || `${catInfo?.value || 'Issue'} reported via Fix Karachi`,
      imageUrl: capturedPhoto || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      district: location.district,
      ward: location.ward,
      street: 'Current Location',
      coordinates,
      aiTag: catInfo?.value || 'Unknown',
      aiConfidence: getAIConfidence(category, title, description),
      status: 'reported' as const,
      severity: severity,
      type: category,
      userId: authUser?.uid ?? 'current-user',
      priority: 'medium',
      isDuplicate: Boolean(duplicate && submitAnyway),
      blurhash: blurhash ?? undefined,
    };

    rateLimit.increment();
    setShowSuccess(true);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00D4FF', '#00C896', '#FFB800', '#FF6B35', '#F0F4FF']
      });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      onSubmit(newReport);
    }, 1500);
  };

  const steps = [t.stepDetails, t.stepLocation, t.stepReview];
  const activeCategory = categories.find(c => c.value === category);
  const currentConfidence = getAIConfidence(category, title, description);

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A1628' }}>
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(0,200,150,0.15)', border: '2px solid #00C896' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Check className="w-10 h-10" style={{ color: '#00C896' }} />
          </motion.div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '20px', fontWeight: 700, color: '#F0F4FF', marginBottom: '8px' }}>
            {t.reportSuccess}
          </h2>
          <p style={{ fontSize: '14px', color: '#8BA3C7' }}>{t.submitReport}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-12" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-[#0e1417]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
            <h1 className="text-xl md:text-2xl font-black text-[#e8f4f8] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t.reportTitle}
            </h1>
          </div>

          {/* Stepper bar for desktop/mobile */}
          <div className="flex items-center gap-2 md:gap-4 md:w-96">
            {steps.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col gap-2 relative">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    background: i < step ? '#00d4ff' : i === step - 1 ? '#00d4ff' : 'rgba(255,255,255,0.1)',
                    boxShadow: i <= step - 1 ? '0 0 10px rgba(0,212,255,0.5)' : 'none'
                  }}
                />
                <span className="hidden md:block text-xs font-bold uppercase tracking-wider text-center" style={{ color: i <= step - 1 ? '#00d4ff' : '#4A6080' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Steps (Span 7) */}
          <div className="lg:col-span-7 bg-[#1a2123]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-32 -top-32 w-64 h-64 bg-[#00d4ff]/10 rounded-full blur-3xl"></div>
            <AnimatePresence mode="wait">
              {/* Step 1: Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Category Grid */}
                  <div>
                    <label className="text-sm font-bold text-[#e8f4f8] block mb-3 uppercase tracking-wide">
                      {t.reportCategory}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {categories.map((cat) => {
                        const isSelected = category === cat.value;
                        const CategoryIcon = cat.LucideIcon;
                        return (
                          <motion.button
                            key={cat.value}
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border"
                            style={{
                              background: isSelected ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.02)',
                              border: isSelected ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                              boxShadow: isSelected ? '0 0 15px rgba(0,212,255,0.2)' : 'none'
                            }}
                            onClick={() => setCategory(cat.value)}
                            whileTap={{ scale: 0.96 }}
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center border"
                              style={{ 
                                background: isSelected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)', 
                                border: isSelected ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.1)' 
                              }}
                            >
                              <CategoryIcon className="w-6 h-6" style={{ color: isSelected ? '#00d4ff' : '#8ba3c7' }} />
                            </div>
                            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: isSelected ? '#00d4ff' : '#8ba3c7' }}>
                              {t[cat.value as keyof typeof t] as string}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="text-sm font-bold text-[#e8f4f8] block mb-2">
                      {user.language === 'ur' ? 'مسئلے کا عنوان' : 'Issue Title'}
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t.describeIssue}
                      className="w-full bg-[#0e1417] border border-white/10 rounded-xl px-4 py-3 text-[#e8f4f8] placeholder-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-bold text-[#e8f4f8] block mb-2">
                      {t.addDescription}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.addDescription}
                      rows={4}
                      className="w-full bg-[#0e1417] border border-white/10 rounded-xl px-4 py-3 text-[#e8f4f8] placeholder-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', display: 'block', marginBottom: '8px' }}>
                      {t.uploadPhoto}
                    </label>
                    {!capturedPhoto ? (
                      <motion.button
                        className="w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-3"
                        style={{
                          border: '2px dashed rgba(0,212,255,0.2)',
                          background: 'rgba(0,212,255,0.03)',
                        }}
                        onClick={handleCameraCapture}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Camera className="w-8 h-8" style={{ color: '#00D4FF' }} />
                        <span style={{ fontSize: '12px', color: '#4A6080', fontWeight: 500 }}>{t.takePhoto}</span>
                      </motion.button>
                    ) : (
                      <div className="relative aspect-video rounded-xl overflow-hidden">
                        <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                        <button
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                          style={{ background: 'rgba(255,59,59,0.9)' }}
                          onClick={() => setCapturedPhoto('')}
                        >
                          <X className="w-4 h-4" style={{ color: '#FFF' }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Next Button */}
                  <motion.button
                    onClick={() => setStep(2)}
                    disabled={!category}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-lg"
                    style={{
                      background: category ? 'linear-gradient(to right, #00d4ff, #0099cc)' : 'rgba(255,255,255,0.05)',
                      color: category ? '#0e1417' : '#4A6080',
                      boxShadow: category ? '0 0 20px rgba(0,212,255,0.4)' : 'none',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.next}
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Map Mockup */}
                  <div
                    className="w-full rounded-xl overflow-hidden relative"
                    style={{
                      height: '300px',
                      background: '#0A1628',
                      border: '1px solid rgba(0,212,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Simulated Map lines/grid details */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'radial-gradient(circle, #00D4FF 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }} />
                    <MapPin className="w-12 h-12 relative animate-bounce" style={{ color: '#00D4FF' }} />
                    <p style={{ fontSize: '15px', color: '#F0F4FF', fontWeight: 600 }}>{location ? `${location.ward}, ${location.district}` : 'Locating...'}</p>
                    <p style={{ fontSize: '12px', color: '#4A6080', fontFamily: "'JetBrains Mono'" }}>
                      {location ? `${location.lat.toFixed(6)}°N, ${location.lng.toFixed(6)}°E` : '---'}
                    </p>
                  </div>

                  {/* Use Location Button */}
                  <button
                    className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all hover:bg-[rgba(0,212,255,0.04)]"
                    style={{
                      background: 'rgba(0,212,255,0.05)',
                      color: '#00D4FF',
                      border: '1px solid rgba(0,212,255,0.15)',
                    }}
                  >
                    <MapPin className="w-4 h-4 animate-pulse" />
                    {t.useMyLocation}
                  </button>

                  {/* Location Address Details */}
                  <motion.div
                    className="rounded-xl p-4"
                    style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.06)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" style={{ color: '#00D4FF' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF' }}>Detected Ward / Suburb</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#8BA3C7', lineHeight: '1.5' }}>
                      {location ? `${location.ward}, district of ${location.district}, Karachi, Sindh, Pakistan` : 'Detecting your civic constituency...'}
                    </p>
                  </motion.div>

                  {/* Severity Selector */}
                  <motion.div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.06)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4" style={{ color: severity >= 8 ? '#FF3B3B' : severity >= 5 ? '#FFB800' : '#00C896' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF' }}>
                          {user.language === 'ur' ? 'شدت / سنگینی' : 'Issue Severity'}
                        </span>
                      </div>
                      <span 
                        style={{ 
                          fontFamily: "'JetBrains Mono'", 
                          fontSize: '14px', 
                          fontWeight: 900,
                          color: severity >= 8 ? '#FF3B3B' : severity >= 5 ? '#FFB800' : '#00C896',
                          background: severity >= 8 ? 'rgba(255,59,59,0.1)' : severity >= 5 ? 'rgba(255,184,0,0.1)' : 'rgba(0,200,150,0.1)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {severity} / 10
                      </span>
                    </div>
                    
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={severity}
                      onChange={(e) => setSeverity(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00C896 0%, #FFB800 50%, #FF3B3B 100%)`,
                        outline: 'none',
                      }}
                    />
                    
                    <div className="flex justify-between text-xs font-semibold" style={{ color: '#4A6080' }}>
                      <span>{user.language === 'ur' ? 'معمولی' : 'Low'}</span>
                      <span>{user.language === 'ur' ? 'درمیانہ' : 'Medium'}</span>
                      <span>{user.language === 'ur' ? 'انتہائی شدید' : 'Critical'}</span>
                    </div>
                  </motion.div>

                  {/* Navigation buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold"
                      style={{
                        background: 'rgba(0,212,255,0.05)',
                        color: '#8BA3C7',
                        border: '1px solid rgba(0,212,255,0.1)',
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      {t.back}
                    </button>
                    <motion.button
                      onClick={() => setStep(3)}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold"
                      style={{ background: '#00D4FF', color: '#0A1628' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t.next}
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="rounded-xl p-5 space-y-4" style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.06)' }}>
                    <h3 className="text-sm font-bold text-white border-b border-[rgba(0,212,255,0.06)] pb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FFB800]" />
                      {user.language === 'ur' ? 'مسودہ جائزہ' : 'Final Validation Check'}
                    </h3>

                    {rateLimit.isLimited && (
                      <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', color: '#FFB800' }}>
                        {rateLimit.message}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#4A6080] block mb-0.5">{t.reportCategory}</span>
                        <span className="text-white font-semibold capitalize flex items-center gap-1.5">
                          {activeCategory && <activeCategory.LucideIcon className="w-3.5 h-3.5" style={{ color: activeCategory.color }} />}
                          {category}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#4A6080] block mb-0.5">{t.reportLocation}</span>
                        <span className="text-white font-semibold">{location?.ward || user.district}</span>
                      </div>
                    </div>

                    {title && (
                      <div className="border-t border-[rgba(0,212,255,0.04)] pt-3">
                        <span className="text-xs text-[#4A6080] block mb-1">Title</span>
                        <span className="text-sm font-semibold text-white">{title}</span>
                      </div>
                    )}

                    {description && (
                      <div className="border-t border-[rgba(0,212,255,0.04)] pt-3">
                        <span className="text-xs text-[#4A6080] block mb-1">Description</span>
                        <p className="text-xs text-[#8BA3C7] leading-relaxed">{description}</p>
                      </div>
                    )}

                    {/* Duplicate Card */}
                    {duplicate && !submitAnyway && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}>
                        <p style={{ color: '#FFB800', fontSize: '12.5px', lineHeight: '1.5' }}>
                          Warning: A duplicate report was detected nearby ({duplicate.distanceMeters}m away, {duplicate.hoursAgo}h ago).
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="flex-1 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800' }}
                            onClick={() => window.alert(`Duplicate report matching ID: ${duplicate.id}`)}
                          >
                            Inspect Duplicate
                          </button>
                          <button
                            className="flex-1 py-2 rounded-lg text-xs font-bold"
                            style={{ background: '#FFB800', color: '#0A1628' }}
                            onClick={() => setSubmitAnyway(true)}
                          >
                            Submit Anyway
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold"
                      style={{
                        background: 'rgba(0,212,255,0.05)',
                        color: '#8BA3C7',
                        border: '1px solid rgba(0,212,255,0.1)',
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      {t.back}
                    </button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={rateLimit.isLimited}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold"
                      style={{
                        background: rateLimit.isLimited ? 'rgba(0,212,255,0.15)' : '#00C896',
                        color: '#0A1628',
                        boxShadow: rateLimit.isLimited ? 'none' : '0 4px 20px rgba(0,200,150,0.3)',
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t.submitReport}
                      <Check className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Live Mockup Card Preview (Span 5) (Visible only on Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-28">
            <div className="bg-[#1a2123]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(0,212,255,0.06)] rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00D4FF] mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                Live Citizen Card Preview
              </h3>

              {/* Feed Card Simulation */}
              <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.05)] bg-[#0F2040] shadow-lg">
                {/* Simulated Image */}
                <div className="aspect-video relative bg-[#0A1628] flex items-center justify-center overflow-hidden">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Live Card Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center gap-2">
                      <Camera className="w-8 h-8 text-[#4A6080] opacity-50" />
                      <span className="text-[11px] text-[#4A6080] font-semibold">Real-time image upload preview</span>
                    </div>
                  )}

                  {/* AI Confidence Badge */}
                  {category && (
                    <div className="absolute top-3 right-3 bg-[#0A1628] border border-[rgba(0,212,255,0.25)] rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#FFB800]" />
                      <span className="text-[10px] font-bold text-white font-mono">{currentConfidence}% AI Conf.</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: activeCategory ? `${activeCategory.color}15` : 'rgba(0,212,255,0.1)',
                        color: activeCategory ? activeCategory.color : '#8BA3C7',
                      }}
                    >
                      {category || 'Category'}
                    </span>
                    <span className="text-[10px] text-[#4A6080] font-semibold font-mono">Just Now</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {title || 'Issue Title Placeholder'}
                    </h4>
                    <p className="text-xs text-[#8BA3C7] line-clamp-2 mt-1 leading-relaxed">
                      {description || 'Provide details about the issue to see this mock feed card update live.'}
                    </p>
                  </div>

                  {/* District / Address footer */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-[rgba(255,255,255,0.03)] text-[11px] text-[#4A6080]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{location?.ward || 'Detecting Area...'}, {location?.district || 'Karachi'}</span>
                  </div>
                </div>
              </div>

              {/* Extra visual metadata details */}
              <div className="mt-5 space-y-2 bg-[rgba(10,22,40,0.5)] p-3 rounded-lg border border-[rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#4A6080]">Verification Tier</span>
                  <span className="text-[#00C896] font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3" /> Citizens Tier 1
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#4A6080]">SLA Priority Assignment</span>
                  <span className="text-[#00D4FF] font-semibold">Standard (48-72h)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
