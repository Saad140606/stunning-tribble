import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Camera, MapPin, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onReportClick: () => void;
  onQuickPhotoClick: () => void;
  isVisible: boolean;
}

export function FloatingActionButton({
  onReportClick,
  onQuickPhotoClick,
  isVisible
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: Camera,
      label: 'Quick Photo',
      onClick: () => { onQuickPhotoClick(); setIsExpanded(false); }
    },
    {
      icon: MapPin,
      label: 'Report Issue',
      onClick: () => { onReportClick(); setIsExpanded(false); }
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-3 space-y-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-2 justify-end"
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{ background: '#0F2040', color: '#F0F4FF', border: '1px solid rgba(0,212,255,0.15)' }}
                >
                  {action.label}
                </span>
                <button
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: '#162B52',
                    border: '1px solid rgba(0,212,255,0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                  onClick={action.onClick}
                >
                  <action.icon className="w-5 h-5" style={{ color: '#00D4FF' }} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: isExpanded ? '#FF3B3B' : '#00D4FF',
          boxShadow: isExpanded
            ? '0 4px 20px rgba(255,59,59,0.3)'
            : '0 4px 20px rgba(0,212,255,0.35)',
          transition: 'background 0.2s',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: isExpanded ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isExpanded ? (
          <X className="w-6 h-6" style={{ color: '#FFFFFF' }} />
        ) : (
          <Plus className="w-6 h-6" style={{ color: '#0A1628' }} />
        )}
      </motion.button>
    </div>
  );
}