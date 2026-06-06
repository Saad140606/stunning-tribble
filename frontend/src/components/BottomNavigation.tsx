import React from 'react';
import { Home, Plus, Map, User, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../App';
import { translations, Language } from './translations';

interface BottomNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  language: Language;
}

export function BottomNavigation({ currentScreen, onScreenChange, language }: BottomNavigationProps) {
  const t = translations[language];

  const navItems = [
    { id: 'home' as Screen, icon: Home, label: t.home },
    { id: 'analytics' as Screen, icon: BarChart3, label: t.analytics },
    { id: 'report' as Screen, icon: Plus, label: t.report, isCenter: true },
    { id: 'map' as Screen, icon: Map, label: t.map },
    { id: 'profile' as Screen, icon: User, label: t.profile },
  ];

  const handleTap = (id: Screen) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch (e) {
        // Ignored
      }
    }
    onScreenChange(id);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto px-4 py-2 z-[9999] pointer-events-auto"
      style={{
        background: '#0A1628',
        borderTop: '1px solid rgba(0, 212, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-around pointer-events-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          if (item.isCenter) {
            return (
              <motion.button
                key={item.id}
                className="relative flex items-center justify-center -mt-5"
                onClick={() => handleTap(item.id)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center relative"
                  style={{
                    background: '#00D4FF',
                    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.35)',
                  }}
                >
                  {/* Pulse Ring */}
                  <span className="absolute inset-0 rounded-full bg-[#00D4FF] opacity-40 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                  <Plus className="w-6 h-6 relative z-10 animate-pulse" style={{ color: '#0A1628' }} />
                </div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.id}
              className="flex flex-col items-center justify-center py-2 px-3 relative"
              onClick={() => handleTap(item.id)}
              whileTap={{ scale: 0.92 }}
            >
              <Icon
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: isActive ? '#00D4FF' : '#4A6080' }}
              />
              {isActive ? (
                <>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs mt-1 font-semibold"
                    style={{ color: '#00D4FF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '10px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {item.label}
                  </motion.span>
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ background: '#00D4FF' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </>
              ) : (
                <span className="text-xs mt-1 opacity-0" style={{ fontSize: '10px' }}>
                  {item.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}