import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const milestones = [
  { percent: 0, text: 'Initializing civic service engine...' },
  { percent: 20, text: 'Connecting local SQLite database...' },
  { percent: 45, text: 'Syncing offline reports queue...' },
  { percent: 70, text: 'Retrieving Haversine heatmap points...' },
  { percent: 90, text: 'Verifying JWT access session...' },
  { percent: 100, text: 'Welcome to Fix Karachi' }
];

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [milestoneText, setMilestoneText] = useState(milestones[0].text);

  useEffect(() => {
    const duration = 2200; // 2.2 seconds total load time
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(nextProgress);

      // Find the milestone matches
      const activeMilestone = [...milestones]
        .reverse()
        .find(m => nextProgress >= m.percent);
      if (activeMilestone) {
        setMilestoneText(activeMilestone.text);
      }

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
         style={{ background: '#0A1628' }}>
      
      {/* Background Animated Particles */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              background: '#00D4FF',
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100 - Math.random() * 100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* FK Monogram with pulse ring */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-8"
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid #00D4FF' }}
            animate={{
              scale: [1, 1.5, 1.8],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid #00D4FF' }}
            animate={{
              scale: [1, 1.3, 1.6],
              opacity: [0.4, 0.15, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5
            }}
          />

          {/* FK circle */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)'
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '36px',
                fontWeight: 800,
                color: '#0A1628',
                letterSpacing: '-1px',
              }}
            >
              FK
            </span>
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '30px',
            fontWeight: 800,
            color: '#F0F4FF',
            marginBottom: '8px',
            letterSpacing: '-0.5px',
          }}
        >
          Fix Karachi
        </motion.h1>

        {/* Urdu tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: '18px',
            color: '#8BA3C7',
            marginBottom: '32px',
            direction: 'rtl',
          }}
        >
          شہر آپ کا، آواز آپ کی
        </motion.p>

        {/* Stateful percentage text */}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
          {progress}%
        </div>

        {/* Loading bar container */}
        <div
          className="w-48 h-1.5 mx-auto overflow-hidden mb-6"
          style={{
            background: 'rgba(0, 212, 255, 0.1)',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00D4FF, #00A3CC)',
              borderRadius: '4px',
              width: `${progress}%`,
              transition: 'width 0.1s linear'
            }}
          />
        </div>

        {/* Milestone Description */}
        <div
          className="text-xs font-semibold h-4 select-none"
          style={{ color: '#4A6080', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {milestoneText}
        </div>
      </motion.div>
    </div>
  );
}