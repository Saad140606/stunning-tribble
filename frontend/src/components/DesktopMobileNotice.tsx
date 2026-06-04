import React, { useEffect, useState } from 'react';
import { isDesktopDevice } from '../utils/mobileDetection';

const DesktopMobileNotice: React.FC = () => {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (isDesktopDevice()) {
      setShowNotice(true);
      
      // Auto-hide notice after 5 seconds
      const timer = setTimeout(() => {
        setShowNotice(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showNotice) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs text-center">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div>
          <div className="font-medium">Mobile Simulation Mode</div>
          <div className="text-xs opacity-90">Optimized for mobile devices</div>
        </div>
        <button 
          onClick={() => setShowNotice(false)}
          className="ml-2 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default DesktopMobileNotice;