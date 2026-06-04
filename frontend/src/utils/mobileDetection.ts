// Mobile detection and mobile-first utilities

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor;
  
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check for touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || (hasTouchSupport && isSmallScreen);
};

export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && window.innerWidth > 768;
};

export const forceMobileViewport = (): void => {
  if (typeof window === 'undefined') return;
  
  // Add or update viewport meta tag for mobile optimization
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  viewport.setAttribute(
    'content', 
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  );
};

export const addMobileWebAppMeta = (): void => {
  if (typeof window === 'undefined') return;
  
  const metaTags = [
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'theme-color', content: '#10b981' }
  ];
  
  metaTags.forEach(({ name, content }) => {
    let existingMeta = document.querySelector(`meta[name="${name}"]`);
    if (!existingMeta) {
      existingMeta = document.createElement('meta');
      existingMeta.setAttribute('name', name);
      document.head.appendChild(existingMeta);
    }
    existingMeta.setAttribute('content', content);
  });
};

export const initializeMobileFirst = (): void => {
  forceMobileViewport();
  addMobileWebAppMeta();
  
  // Add desktop mobile simulation class if on desktop
  if (isDesktopDevice()) {
    document.body.classList.add('desktop-mobile-simulation');
  }
  
  // Disable zoom on mobile
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
};

export const getDeviceInfo = () => {
  return {
    isMobile: isMobileDevice(),
    isDesktop: isDesktopDevice(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
};