import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Shield, BarChart3, ChevronRight } from 'lucide-react';
import { translations, Language } from './translations';

interface OnboardingScreenProps {
  onComplete: () => void;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const slides = [
  {
    icon: MapPin,
    titleKey: 'slide1Title' as const,
    subtitleKey: 'slide1Subtitle' as const,
    color: '#00D4FF',
  },
  {
    icon: Shield,
    titleKey: 'slide2Title' as const,
    subtitleKey: 'slide2Subtitle' as const,
    color: '#00C896',
  },
  {
    icon: BarChart3,
    titleKey: 'slide3Title' as const,
    subtitleKey: 'slide3Subtitle' as const,
    color: '#FFB800',
  },
];

export function OnboardingScreen({ onComplete, currentLanguage, onLanguageChange }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const t = translations[currentLanguage];

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#0A1628' }}
    >
      {/* Header: Language toggle + Skip */}
      <div className="flex items-center justify-between p-4 pt-6 relative z-10">
        <button
          onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ur' : 'en')}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          style={{
            background: 'rgba(0, 212, 255, 0.1)',
            color: '#00D4FF',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {currentLanguage === 'en' ? 'اردو' : 'EN'}
        </button>

        <button
          onClick={onComplete}
          className="text-sm transition-colors"
          style={{ color: '#4A6080', fontFamily: "'Inter', sans-serif" }}
        >
          {t.skip}
        </button>
      </div>

      {/* FK Monogram */}
      <div className="flex justify-center mt-8 mb-4">
        <motion.div
          className="relative w-16 h-16"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.25)',
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '24px',
                fontWeight: 800,
                color: '#0A1628',
              }}
            >
              FK
            </span>
          </div>
        </motion.div>
      </div>

      {/* App Name */}
      <motion.div
        className="text-center mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '24px',
            fontWeight: 800,
            color: '#F0F4FF',
          }}
        >
          Fix Karachi
        </h1>
        <p
          style={{
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: '15px',
            color: '#8BA3C7',
            direction: 'rtl',
            marginTop: '4px',
          }}
        >
          شہر آپ کا، آواز آپ کی
        </p>
      </motion.div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center text-center w-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 && currentSlide < slides.length - 1) {
                goToSlide(currentSlide + 1);
              } else if (info.offset.x > 80 && currentSlide > 0) {
                goToSlide(currentSlide - 1);
              }
            }}
          >
            {/* Icon Circle */}
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
              style={{
                background: `${slide.color}15`,
                border: `2px solid ${slide.color}30`,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Icon
                className="w-10 h-10"
                style={{ color: slide.color }}
              />
            </motion.div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#F0F4FF',
                marginBottom: '12px',
              }}
            >
              {t[slide.titleKey]}
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '14px',
                color: '#8BA3C7',
                lineHeight: 1.6,
                maxWidth: '280px',
                fontFamily: currentLanguage === 'ur' ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif",
              }}
            >
              {t[slide.subtitleKey]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: Progress Dots + Action Button */}
      <div className="px-8 pb-10">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="relative h-2 rounded-full transition-all duration-300"
              style={{
                width: currentSlide === index ? '24px' : '8px',
                background: currentSlide === index ? '#00D4FF' : 'rgba(0, 212, 255, 0.2)',
              }}
            >
              {currentSlide === index && (
                <motion.div
                  layoutId="activeSlide"
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#00D4FF' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {currentSlide === slides.length - 1 ? (
          <motion.button
            onClick={onComplete}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all"
            style={{
              background: '#00D4FF',
              color: '#0A1628',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t.getStarted}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            onClick={nextSlide}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              color: '#00D4FF',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t.next}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}