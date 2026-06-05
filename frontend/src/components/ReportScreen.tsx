import React, { useState } from 'react';
import { Camera, MapPin, X, Check, ChevronRight, ChevronLeft, Zap, Trash2, Lightbulb, Droplets, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report, User } from '../App';
import { translations } from './translations';
import confetti from 'canvas-confetti';
import { useRateLimit } from '../hooks/useRateLimit';
import { DuplicateCandidate, findPotentialDuplicate } from '../utils/duplicateDetection';
import { createImageBlurhash } from '../utils/imageHash';
import { useAuth } from '../context/AuthContext';

interface ReportScreenProps {
  user: User;
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

export function ReportScreen({ user, onSubmit, onCancel }: ReportScreenProps) {
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

  const t = translations[user.language];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            ward: 'Live Ward', // Replace with reverse geocoding if available
            district: 'Live District' // Replace with reverse geocoding if available
          });
        },
        (error) => {
          console.error("Error getting location", error);
          // Fallback to default Karachi location
          setLocation({
            lat: user.coordinates.lat,
            lng: user.coordinates.lng,
            ward: 'Saddar',
            district: user.district
          });
        }
      );
    }
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
      aiConfidence: Math.floor(Math.random() * 15) + 85,
      status: 'reported' as const,
      severity: 7,
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
    <div className="min-h-screen" style={{ background: '#0A1628' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-3"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} className="p-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.08)' }}>
            <X className="w-4 h-4" style={{ color: '#8BA3C7' }} />
          </button>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '16px', fontWeight: 700, color: '#F0F4FF' }}>
            {t.reportTitle}
          </h1>
          <div className="w-8" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex-1">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    background: i < step ? '#00D4FF' : i === step - 1 ? '#00D4FF' : 'rgba(0,212,255,0.1)',
                  }}
                />
                <span style={{ fontSize: '10px', color: i < step ? '#00D4FF' : '#4A6080', marginTop: '4px', display: 'block' }}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Category Grid */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', display: 'block', marginBottom: '12px' }}>
                  {t.reportCategory}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const isSelected = category === cat.value;
                    const CategoryIcon = cat.LucideIcon;
                    return (
                      <motion.button
                        key={cat.value}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                        style={{
                          background: isSelected ? `${cat.color}15` : '#0F2040',
                          border: `2px solid ${isSelected ? cat.color : 'rgba(0,212,255,0.08)'}`,
                        }}
                        onClick={() => setCategory(cat.value)}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
                        >
                          <CategoryIcon className="w-5 h-5" style={{ color: cat.color }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: isSelected ? cat.color : '#8BA3C7' }}>
                          {t[cat.value as keyof typeof t] as string}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', display: 'block', marginBottom: '8px' }}>
                  {t.describeIssue}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.describeIssue}
                  className="w-full fk-input"
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', display: 'block', marginBottom: '8px' }}>
                  {t.addDescription}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.addDescription}
                  rows={3}
                  className="w-full fk-input resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', display: 'block', marginBottom: '8px' }}>
                  {t.uploadPhoto}
                </label>
                {!capturedPhoto ? (
                  <motion.button
                    className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center gap-3"
                    style={{
                      border: '2px dashed rgba(0,212,255,0.2)',
                      background: 'rgba(0,212,255,0.03)',
                    }}
                    onClick={handleCameraCapture}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Camera className="w-10 h-10" style={{ color: '#00D4FF' }} />
                    <span style={{ fontSize: '13px', color: '#4A6080' }}>{t.takePhoto}</span>
                  </motion.button>
                ) : (
                  <div className="relative aspect-video rounded-2xl overflow-hidden">
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    <button
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
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
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-opacity"
                style={{
                  background: category ? '#00D4FF' : 'rgba(0,212,255,0.2)',
                  color: category ? '#0A1628' : '#4A6080',
                  opacity: category ? 1 : 0.5,
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
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Map placeholder */}
              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{
                  height: '280px',
                  background: '#0F2040',
                  border: '1px solid rgba(0,212,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <MapPin className="w-12 h-12" style={{ color: '#00D4FF' }} />
                <p style={{ fontSize: '14px', color: '#8BA3C7' }}>Karachi, Pakistan</p>
                <p style={{ fontSize: '12px', color: '#4A6080' }}>
                  {user.coordinates.lat.toFixed(4)}°N, {user.coordinates.lng.toFixed(4)}°E
                </p>
              </div>

              {/* Use Location Button */}
              <button
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(0,212,255,0.08)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0,212,255,0.15)',
                }}
              >
                <MapPin className="w-4 h-4" />
                {t.useMyLocation}
              </button>

              {/* Address Card */}
              <motion.div
                className="rounded-2xl p-4"
                style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" style={{ color: '#00D4FF' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF' }}>Detected Location</span>
                </div>
                <p style={{ fontSize: '13px', color: '#8BA3C7' }}>
                  {user.district} • {user.coordinates.lat.toFixed(4)}, {user.coordinates.lng.toFixed(4)}
                </p>
              </motion.div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
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
                  className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold"
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
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Summary Card */}
              <div
                className="rounded-2xl p-4 space-y-4"
                style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FF' }}>{t.stepReview}</h3>
                {rateLimit.isLimited && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', color: '#FFB800' }}>
                    {rateLimit.message}
                  </div>
                )}

                {capturedPhoto && (
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <img src={capturedPhoto} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ fontSize: '13px', color: '#4A6080' }}>{t.reportCategory}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF', textTransform: 'capitalize' }}>
                      {category}
                    </span>
                  </div>
                  {title && (
                    <div className="flex justify-between">
                      <span style={{ fontSize: '13px', color: '#4A6080' }}>Title</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF' }}>{title}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ fontSize: '13px', color: '#4A6080' }}>{t.reportLocation}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF' }}>{user.district}</span>
                  </div>
                </div>

                {description && (
                  <p style={{ fontSize: '13px', color: '#8BA3C7', borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: '12px' }}>
                    {description}
                  </p>
                )}

                {duplicate && !submitAnyway && (
                  <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.28)' }}>
                    <p style={{ color: '#FFB800', fontSize: 13 }}>
                      Similar issue already reported {duplicate.hoursAgo} hours ago within {duplicate.distanceMeters}m.
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 rounded-lg text-sm"
                        style={{ background: '#0A1628', color: '#00D4FF' }}
                        onClick={() => window.alert(`Existing report: ${duplicate.id}`)}
                      >
                        View Existing
                      </button>
                      <button
                        className="flex-1 py-2 rounded-lg text-sm font-bold"
                        style={{ background: '#FFB800', color: '#0A1628' }}
                        onClick={() => setSubmitAnyway(true)}
                      >
                        Submit Anyway
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
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
                  className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold"
                  style={{
                    background: rateLimit.isLimited ? 'rgba(0,212,255,0.2)' : '#00D4FF',
                    color: '#0A1628',
                    boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
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
    </div>
  );
}
