import React from 'react';
import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
         style={{ background: '#0A1628' }}>
      <motion.div
        className="text-center"
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
            repeatType: "reverse"
          }}
        >
          {/* Pulse ring */}
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
              ease: "easeOut"
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
              ease: "easeOut",
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
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '28px',
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
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: '18px',
            color: '#8BA3C7',
            marginBottom: '40px',
            direction: 'rtl',
          }}
        >
          شہر آپ کا، آواز آپ کی
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="w-40 h-1 mx-auto overflow-hidden"
          style={{
            background: 'rgba(0, 212, 255, 0.1)',
            borderRadius: '4px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00D4FF, #00A3CC)',
              borderRadius: '4px',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1, duration: 1.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}