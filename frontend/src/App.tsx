import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { LoadingScreen } from './components/LoadingScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { motion, AnimatePresence } from 'motion/react';

const ReportScreen = React.lazy(() => import('./components/ReportScreen').then(m => ({ default: m.ReportScreen })));
const LeafletMapScreen = React.lazy(() => import('./components/LeafletMapScreen').then(m => ({ default: m.LeafletMapScreen })));
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const AnalyticsScreen = React.lazy(() => import('./components/AnalyticsScreen').then(m => ({ default: m.AnalyticsScreen })));
import { BottomNavigation } from './components/BottomNavigation';
import { DesktopNavigation } from './components/DesktopNavigation';
import { translations, Language, isRTL, getStoredLanguage, storeLanguage } from './components/translations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AdminApp } from './admin/AdminLayout';
import { TransparencyScreen } from './screens/TransparencyScreen';
import { LandingPage } from './pages/LandingPage';
import { SOSButton } from './components/SOSButton';
import { findLocalDuplicate } from './utils/duplicateDetection';
import { apiFetch } from './services/api';
import { getQueuedComplaints, queueComplaint, removeQueuedComplaint } from './utils/offlineQueue';
import { NotificationBell } from './components/notifications/NotificationBell';
import { EmergencyAlertBanner } from './components/notifications/EmergencyAlertBanner';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { createNotification, updateUserNotificationLocation } from './services/notificationService';
import { useMediaQuery } from './hooks/useMediaQuery';
import {
  Bell, Search, User as UserIcon, X, MapPin, ThumbsUp, Flag, Heart, MessageCircle, Clock,
  AlertTriangle, Trash2, Lightbulb, Droplets, ShieldAlert, Zap
} from 'lucide-react';

export interface Report {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  media?: MediaItem[];
  district: string;
  ward: string;
  street: string;
  coordinates: { lat: number; lng: number };
  distance: number;
  timestamp: Date;
  aiTag: string;
  aiConfidence: number;
  status: 'reported' | 'inprogress' | 'resolved' | 'emergency' | 'flagged';
  upvotes: number;
  comments: Comment[];
  severity: number;
  type: string;
  userId?: string;
  hasUserUpvoted?: boolean;
  isTamperDetected?: boolean;
  priority?: 'high' | 'medium' | 'low';
  isDuplicate?: boolean;
  blurhash?: string;
  flag_count?: number;
  verify_count?: number;
  hasUserVerified?: boolean;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  author: string;
}

export interface User {
  district: string;
  coordinates: { lat: number; lng: number };
  language: Language;
  isOnline: boolean;
}

export type Screen = 'onboarding' | 'home' | 'report' | 'map' | 'profile' | 'analytics' | 'notifications';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

interface AppLayoutProps {
  currentScreen: Screen;
  user: User;
  selectedReport: Report | null;
  onScreenChange: (screen: Screen) => void;
  onToggleLanguage: () => void;
  languageLabel: string;
  children: React.ReactNode;
}

const screenLabels: Record<Screen, string> = {
  onboarding: 'Onboarding',
  home: 'Home',
  report: 'Report Issue',
  map: 'Civic Map',
  profile: 'Profile',
  analytics: 'Analytics',
  notifications: 'Notifications',
};

function TopBar({
  currentScreen,
  onOpenNotifications,
}: {
  currentScreen: Screen;
  onOpenNotifications: () => void;
}) {
  const { profile } = useAuth();
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'FK';

  return (
    <header className="sticky top-0 w-full z-50 bg-[#0f2040]/70 backdrop-blur-xl border-b border-white/10 shadow-2xl h-20 px-4 md:px-8 flex justify-between items-center max-w-full mx-auto" style={{ left: 0 }}>
      <div className="flex items-center gap-8 md:pl-0 pl-12"> {/* pl-12 on mobile to account for hamburger if any */}
        <span className="font-headline-lg text-xl md:text-2xl font-black text-[#00d4ff] tracking-tighter lg:hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Fix Karachi</span>
        <nav className="hidden md:flex gap-6">
          <span className="text-on-surface-variant font-medium text-sm capitalize">{screenLabels[currentScreen]}</span>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            placeholder="Search reports..." 
            className="bg-[#1a2123]/80 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-[#e8f4f8] focus:outline-none focus:border-[#00d4ff] transition-all w-64"
          />
        </div>
        <button className="p-2 rounded-full hover:bg-white/5 transition-all duration-300 active:scale-95 text-[#00d4ff]" onClick={onOpenNotifications} aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </button>
        <div className="h-10 w-10 rounded-full border border-[#00d4ff]/30 overflow-hidden flex items-center justify-center bg-[#00d4ff]/10 text-[#00d4ff] font-bold text-sm">
          {initials}
        </div>
      </div>
    </header>
  );
}

function DesktopLayout({
  currentScreen,
  user,
  selectedReport,
  onScreenChange,
  onToggleLanguage,
  languageLabel,
  children,
}: AppLayoutProps) {
  return (
    <div className="fk-app-shell fk-app-shell-desktop bg-[#0e1417] min-h-screen">
      <DesktopNavigation
        currentScreen={currentScreen}
        onScreenChange={onScreenChange}
        onToggleLanguage={onToggleLanguage}
        languageLabel={languageLabel}
        isOnline={user.isOnline}
      />
      <div className={`fk-app-content ${selectedReport ? 'fk-has-right-panel' : ''}`}>
        <TopBar currentScreen={currentScreen} onOpenNotifications={() => onScreenChange('notifications')} />
        <div className="pt-8 px-6 pb-20">
          {children}
        </div>
        <div className="fixed bottom-20 right-4 z-40">
          <SOSButton />
        </div>
      </div>
    </div>
  );
}



function MobileLayout({ currentScreen, user, onScreenChange, children }: AppLayoutProps) {
  return (
    <div className="fk-app-shell fk-app-shell-mobile bg-[#0e1417] min-h-screen">
      <TopBar currentScreen={currentScreen} onOpenNotifications={() => onScreenChange('notifications')} />
      <div className="fk-app-content pt-20 pb-20">
        {children}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f2040]/80 backdrop-blur-2xl border-t border-white/5">
          <BottomNavigation
            currentScreen={currentScreen}
            onScreenChange={onScreenChange}
            language={user.language}
          />
        </div>
        <div className="fixed bottom-20 right-4 z-40">
          <SOSButton />
        </div>
      </div>
    </div>
  );
}

function TabletLayout({ currentScreen, user, onScreenChange, onToggleLanguage, languageLabel, children }: AppLayoutProps) {
  return (
    <div className="fk-app-shell fk-app-shell-tablet bg-[#0e1417] min-h-screen">
      <TopBar currentScreen={currentScreen} onOpenNotifications={() => onScreenChange('notifications')} />
      <div className="fk-app-content pt-20 pb-8">
        {children}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f2040]/80 backdrop-blur-2xl border-t border-white/5">
          <BottomNavigation
            currentScreen={currentScreen}
            onScreenChange={onScreenChange}
            language={user.language}
          />
        </div>
        <div className="fixed bottom-20 right-4 z-40">
          <SOSButton />
        </div>
      </div>
    </div>
  );
}

function normalizeStatus(status: unknown): Report['status'] {
  if (status === 'in_progress') return 'inprogress';
  if (['reported', 'inprogress', 'resolved', 'emergency', 'flagged'].includes(String(status))) {
    return status as Report['status'];
  }
  return 'reported';
}

function normalizePriority(priority: unknown, severity = 5): Report['priority'] {
  if (priority === 'high' || priority === 'medium' || priority === 'low') return priority;
  const score = Number(priority);
  if (score >= 8 || severity >= 8) return 'high';
  if (score >= 4 || severity >= 5) return 'medium';
  return 'low';
}

function mapApiComplaintToReport(item: any): Report {
  const severity = Number(item.severity ?? 5);
  const lat = Number(item.latitude ?? item.coordinates?.lat ?? 24.8607);
  const lng = Number(item.longitude ?? item.coordinates?.lng ?? 67.0011);
  const type = String(item.category ?? item.type ?? 'civic').toLowerCase();
  return {
    id: String(item.id),
    title: item.title ?? `${type} report`,
    description: item.description ?? 'Civic issue reported through Fix Karachi.',
    imageUrl: item.imageUrl || item.image_url || '',
    district: item.district || 'Karachi',
    ward: item.ward || item.district || 'Karachi',
    street: item.street || 'Pinned location',
    coordinates: { lat, lng },
    distance: 0,
    timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
    aiTag: item.category ?? item.type ?? 'Civic Issue',
    aiConfidence: Math.min(98, 78 + severity * 2),
    status: normalizeStatus(item.status),
    upvotes: Number(item.upvotes ?? item.voteCount ?? 0),
    comments: Array.isArray(item.comments) ? item.comments : [],
    severity,
    type,
    userId: item.userId ? String(item.userId) : undefined,
    hasUserUpvoted: Boolean(item.hasUserUpvoted),
    priority: normalizePriority(item.priority, severity),
    isDuplicate: Boolean(item.isDuplicate),
    blurhash: item.blurhash,
    flag_count: Number(item.flagCount ?? item.flag_count ?? 0),
    verify_count: Number(item.verifyCount ?? item.verify_count ?? 0),
    hasUserVerified: Boolean(item.hasUserVerified),
  };
}

const categoryColors: Record<string, string> = {
  pothole: '#FF6B35', road: '#FF6B35',
  garbage: '#00C896',
  streetlight: '#FFB800',
  water: '#00D4FF',
  sewerage: '#8B5CF6', drainage: '#8B5CF6',
  safety: '#FF3B3B',
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  pothole: AlertTriangle, road: AlertTriangle,
  garbage: Trash2,
  streetlight: Lightbulb,
  water: Droplets,
  sewerage: Zap, drainage: Zap,
  safety: ShieldAlert,
};

function CitizenApp() {
  const { user: authUser } = useAuth();
  const { notify } = useNotifications();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [user, setUser] = useState<User>({
    district: 'Karachi',
    coordinates: { lat: 24.8607, lng: 67.0011 },
    language: getStoredLanguage(),
    isOnline: true
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newComment, setNewComment] = useState('');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    setNewComment('');
  }, [selectedReport]);

  const activeReport = selectedReport
    ? reports.find(r => r.id === selectedReport.id) || selectedReport
    : null;

  const handleCommentSubmit = (e: React.FormEvent, reportId: string) => {
    e.preventDefault();
    if (newComment.trim()) {
      handleAddComment(reportId, newComment.trim());
      setNewComment('');
    }
  };

  const t = translations[user.language];

  const formatTimeAgo = (timestamp: Date) => {
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - ts.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return `${diffMins}${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours}${t.hoursAgo}`;
    return `${diffDays}${t.daysAgo}`;
  };

  const getStatusStyle = (status: Report['status']) => {
    switch (status) {
      case 'reported': return { bg: 'rgba(255,107,53,0.15)', color: '#FF6B35', text: t.statusReported };
      case 'inprogress': return { bg: 'rgba(255,184,0,0.15)', color: '#FFB800', text: t.statusInProgress };
      case 'resolved': return { bg: 'rgba(0,200,150,0.15)', color: '#00C896', text: t.statusResolved };
      case 'emergency': return { bg: 'rgba(255,59,59,0.18)', color: '#FF3B3B', text: t.statusEmergency };
      case 'flagged': return { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6', text: t.statusFlagged };
      default: return { bg: 'rgba(0,212,255,0.1)', color: '#8BA3C7', text: status };
    }
  };

  // Manage RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL(user.language) ? 'rtl' : 'ltr';
    document.documentElement.lang = user.language === 'ur' ? 'ur' : 'en';
  }, [user.language]);

  // App initialization loading
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  }, []);

  const syncQueuedComplaints = async () => {
    try {
      const queued = await getQueuedComplaints();
      if (!queued.length) return;
      for (const item of queued) {
        const response = await apiFetch('/complaints', {
          method: 'POST',
          body: JSON.stringify({
            title: item.title,
            description: item.description,
            category: item.category,
            severity: item.severity,
            status: item.status,
            latitude: item.latitude,
            longitude: item.longitude,
            district: item.district,
            ward: item.ward,
            street: item.street,
            imageUrl: item.imageUrl,
            blurhash: item.blurhash,
            priority: item.priority,
            slaDeadline: item.slaDeadline,
            isDuplicate: item.isDuplicate,
          }),
        });
        if (response.ok) {
          await removeQueuedComplaint(item.queuedAt);
        }
      }
      toast.success('Offline reports synced');
    } catch (err) {
      console.error('Failed to sync queued complaints:', err);
    }
  };

  useEffect(() => {
    const updateOnline = () => {
      setUser((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
      }));
    };

    const handleOnline = () => {
      updateOnline();
      syncQueuedComplaints();
    };

    updateOnline();
    if (navigator.onLine) {
      syncQueuedComplaints();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!authUser?.uid) return;
    updateUserNotificationLocation(authUser.uid, user.coordinates).catch((err) => {
      console.error('Failed to update notification location:', err);
    });
  }, [authUser?.uid, user.coordinates]);

  // Fetch live reports from the backend (single polling loop — no duplicate)
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await apiFetch('/complaints/public');
        if (response.ok) {
          const data = await response.json();
          setReports((data.complaints || []).map(mapApiComplaintToReport));
        } else {
          // Fallback to mock data if API fails
          setReports(getMockReports());
        }
      } catch (error) {
        console.error("Failed to fetch reports, using mock data:", error);
        setReports(getMockReports());
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getMockReports = (): Report[] => [
      {
        id: '1',
        title: 'Major pothole on Shahrah-e-Faisal',
        description: 'Deep pothole near PIDC causing severe traffic disruption. Multiple vehicles damaged. Urgent repair needed before monsoon season.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'Shahrah-e-Faisal',
        coordinates: { lat: 24.8615, lng: 67.0099 },
        distance: 0.3,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 94,
        status: 'reported',
        upvotes: 47,
        comments: [
          { id: '1', text: 'This is causing major jams daily!', timestamp: new Date(), author: 'Ahmed Khan' },
          { id: '2', text: 'My car tire got damaged here', timestamp: new Date(), author: 'Sara Ali' },
        ],
        severity: 9,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '2',
        title: 'Garbage pile-up in Nazimabad',
        description: 'Overflowing waste collection point creating sanitation hazard',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Nazimabad',
        street: 'Block A',
        coordinates: { lat: 24.9173, lng: 67.0372 },
        distance: 2.1,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 91,
        status: 'reported',
        upvotes: 34,
        comments: [],
        severity: 7,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Street light outage on University Road',
        description: 'Multiple lights are non-functional, creating safety concerns at night',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Gulshan',
        street: 'University Road',
        coordinates: { lat: 24.8801, lng: 67.0618 },
        distance: 1.8,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 96,
        status: 'inprogress',
        upvotes: 52,
        comments: [],
        severity: 6,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '4',
        title: 'Water line burst on Clifton Road',
        description: 'Major water wastage and road damage from burst pipe',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Clifton',
        street: 'Road 7',
        coordinates: { lat: 24.7741, lng: 67.0308 },
        distance: 3.5,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 89,
        status: 'reported',
        upvotes: 41,
        comments: [],
        severity: 8,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '5',
        title: 'Sewerage overflow near Korangi',
        description: 'Health hazard due to untreated sewage backing up into streets',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Korangi',
        street: 'Main Street',
        coordinates: { lat: 24.8501, lng: 67.1156 },
        distance: 5.2,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        aiTag: 'Sewerage System',
        aiConfidence: 87,
        status: 'emergency',
        upvotes: 68,
        comments: [],
        severity: 9,
        type: 'sewerage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '6',
        title: 'Damaged sidewalk near Jinnah Super Market',
        description: 'Cracked and uneven pavement creating pedestrian hazard',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'M.A. Jinnah Road',
        coordinates: { lat: 24.8623, lng: 67.0096 },
        distance: 0.5,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 93,
        status: 'reported',
        upvotes: 29,
        comments: [],
        severity: 5,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'low'
      },
      {
        id: '7',
        title: 'Street robbery incident near Defense',
        description: 'Multiple reports of safety concerns in the area',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Defense',
        street: 'Block 12',
        coordinates: { lat: 24.9296, lng: 67.0581 },
        distance: 4.3,
        timestamp: new Date(Date.now() - 38 * 60 * 60 * 1000),
        aiTag: 'Safety Concern',
        aiConfidence: 85,
        status: 'reported',
        upvotes: 56,
        comments: [],
        severity: 8,
        type: 'safety',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '8',
        title: 'Excessive garbage dumping in Malir',
        description: 'Illegal waste disposal site causing environmental damage',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Malir',
        street: 'Toll Road',
        coordinates: { lat: 24.8101, lng: 67.3241 },
        distance: 15.6,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 92,
        status: 'inprogress',
        upvotes: 38,
        comments: [],
        severity: 7,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '9',
        title: 'Water supply disruption in Kemari',
        description: 'Area has been without running water for 3 days',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Kemari',
        street: 'Beach Road',
        coordinates: { lat: 24.7886, lng: 67.1936 },
        distance: 8.4,
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 90,
        status: 'reported',
        upvotes: 45,
        comments: [],
        severity: 8,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '10',
        title: 'Damaged street light poles on Burns Road',
        description: 'Fallen poles creating safety hazard and blocking traffic',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'Burns Road',
        coordinates: { lat: 24.8556, lng: 67.0245 },
        distance: 1.2,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 94,
        status: 'emergency',
        upvotes: 72,
        comments: [],
        severity: 9,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '11',
        title: 'Pothole in residential area - Gulberg',
        description: 'Small but dangerous pothole affecting daily traffic',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Gulberg',
        street: 'Block 4',
        coordinates: { lat: 24.9054, lng: 67.1005 },
        distance: 6.7,
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 91,
        status: 'reported',
        upvotes: 25,
        comments: [],
        severity: 5,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '12',
        title: 'Open manhole covers on Iqbal Road',
        description: 'Uncovered sewer access points creating hazard for pedestrians',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'Iqbal Road',
        coordinates: { lat: 24.8645, lng: 67.0211 },
        distance: 0.8,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        aiTag: 'Sewerage System',
        aiConfidence: 88,
        status: 'reported',
        upvotes: 33,
        comments: [],
        severity: 7,
        type: 'sewerage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '13',
        title: 'Overflowing trash bin at educational institution',
        description: 'Sanitation issue at a major school affecting students',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Gulshan',
        street: 'Shaheed-e-Millat Road',
        coordinates: { lat: 24.8734, lng: 67.0654 },
        distance: 2.9,
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 89,
        status: 'reported',
        upvotes: 22,
        comments: [],
        severity: 5,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '14',
        title: 'No street lights on parking area road',
        description: 'Commercial area with zero lighting creating security risk',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'Block 12',
        coordinates: { lat: 24.9296, lng: 67.0581 },
        distance: 4.3,
        timestamp: new Date(Date.now() - 38 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 85,
        status: 'reported',
        upvotes: 56,
        comments: [],
        severity: 6,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '15',
        title: 'Water leakage from main line',
        description: 'Continuous water wastage from underground main pipeline',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'Block 12',
        coordinates: { lat: 24.9296, lng: 67.0581 },
        distance: 4.3,
        timestamp: new Date(Date.now() - 38 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 88,
        status: 'inprogress',
        upvotes: 61,
        comments: [],
        severity: 8,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
    ];

  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

  const handleLanguageChange = (language: Language) => {
    setUser(prev => ({ ...prev, language }));
    storeLanguage(language);
  };

  // FIX 8: Persist upvotes to backend with optimistic update
  const handleUpvote = async (reportId: string) => {
    const report = reports.find((item) => item.id === reportId);
    // Optimistic update
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      upvotes: r.upvotes + (r.hasUserUpvoted ? -1 : 1),
      hasUserUpvoted: !r.hasUserUpvoted,
    } : r));
    if (report?.userId && report.userId !== authUser?.uid && !report.hasUserUpvoted) {
      createNotification({
        userId: report.userId,
        title: 'Your report received an upvote',
        message: `${report.title} is gaining support from nearby citizens.`,
        type: 'report_upvoted',
        relatedReportId: report.id,
      }).catch((err) => console.error('Failed to create upvote notification:', err));
    }
    // Persist to backend
    try {
      await apiFetch(`/complaints/${reportId}/upvote`, { method: 'POST' });
    } catch { /* optimistic already applied */ }
  };

  const handleVerify = async (reportId: string) => {
    const report = reports.find((item) => item.id === reportId);
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      verify_count: (r.verify_count ?? 0) + (r.hasUserVerified ? -1 : 1),
      hasUserVerified: !r.hasUserVerified,
    } : r));
    if (report?.userId && report.userId !== authUser?.uid && !report.hasUserVerified) {
      createNotification({
        userId: report.userId,
        title: 'Your report was verified by a citizen',
        message: `${report.title} was verified as a real issue by another citizen nearby.`,
        type: 'report_verified',
        relatedReportId: report.id,
      }).catch((err) => console.error('Failed to create verification notification:', err));
    }
    try {
      await apiFetch(`/complaints/${reportId}/verify`, { method: 'POST' });
    } catch { /* optimistic already applied */ }
  };

  // FIX 8: Persist comments to backend with optimistic update
  const handleAddComment = async (reportId: string, comment: string) => {
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      timestamp: new Date(),
      author: authUser?.email?.split('@')[0] || 'Citizen',
    };
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r, comments: [...(r.comments || []), newComment],
    } : r));
    try {
      await apiFetch(`/complaints/${reportId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text: comment }),
      });
    } catch { /* optimistic already applied */ }
  };

  const handleFlag = async (reportId: string) => {
    // Optimistic update
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      flag_count: (r.flag_count ?? 0) + 1
    } : r));
    
    try {
      await apiFetch(`/complaints/${reportId}/flag`, {
        method: 'POST',
        body: JSON.stringify({ uid: authUser?.uid })
      });
      toast.success('Report flagged as inappropriate / ????? ??? ?? ???');
    } catch (err) {
      console.error('Failed to flag report:', err);
    }
  };

  const handleSubmitReport = async (report: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'>) => {
    const duplicate = findLocalDuplicate(reports, { type: report.type, coordinates: report.coordinates }, 75);
    const payload = {
      title: report.title,
      description: report.description,
      category: report.type,
      severity: report.severity,
      status: report.status,
      latitude: report.coordinates.lat,
      longitude: report.coordinates.lng,
      district: report.district,
      ward: report.ward,
      street: report.street,
      imageUrl: report.imageUrl,
      blurhash: report.blurhash,
      priority: report.priority === 'high' ? 10 : report.priority === 'medium' ? 5 : 1,
      isDuplicate: report.isDuplicate || Boolean(duplicate),
    };

    try {
      const response = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (response.status === 429) {
        const data = await response.json();
        toast.error(data.error || 'Daily report limit reached');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Report submission failed');
      const savedReport = mapApiComplaintToReport(data.complaint);
      setReports((prev) => [savedReport, ...prev.filter((item) => item.id !== savedReport.id)]);
      setCurrentScreen('home');
      await notify({
        title: 'Report submitted successfully',
        message: `${savedReport.title} has been received and is ready for review.`,
        type: 'report_created',
        relatedReportId: savedReport.id,
      }).catch(err => console.warn('Notification failed, but report succeeded:', err));
      toast.success(duplicate ? 'Report submitted and marked as possible duplicate' : 'Report submitted');
    } catch (err) {
      console.error('Report submit failed, queueing offline:', err);
      await queueComplaint(payload);
      const queuedReport: Report = {
        ...report,
        id: `queued-${Date.now()}`,
        timestamp: new Date(),
        upvotes: 0,
        comments: [],
        distance: 0,
        hasUserUpvoted: false,
        isDuplicate: payload.isDuplicate,
      };
      setReports((prev) => [queuedReport, ...prev]);
      setCurrentScreen('home');
      toast.warning('Backend unavailable. Report saved offline and will sync automatically.');
    }
  };

  const layoutMode: LayoutMode = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
  const Layout = isDesktop ? DesktopLayout : isTablet ? TabletLayout : MobileLayout;

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-background w-full mx-auto relative">
        <OnboardingScreen
          onComplete={handleCompleteOnboarding}
          currentLanguage={user.language}
          onLanguageChange={handleLanguageChange}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <Layout
      currentScreen={currentScreen}
      user={user}
      selectedReport={selectedReport}
      onScreenChange={setCurrentScreen}
      onToggleLanguage={() => handleLanguageChange(user.language === 'en' ? 'ur' : 'en')}
      languageLabel={user.language === 'en' ? 'اردو' : 'EN'}
    >
        <EmergencyAlertBanner />
        <div className="fk-page">
          <React.Suspense fallback={
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-10 h-10 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs text-[#4A6080] font-semibold" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Loading civic screen...</p>
            </div>
          }>
            <AnimatePresence mode="wait">
              {currentScreen === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="fk-screen-content w-full"
                >
                  <HomeScreen
                    reports={reports}
                    user={user}
                    layoutMode={layoutMode}
                    onReportSelect={setSelectedReport}
                    onUpvote={handleUpvote}
                    onVerify={handleVerify}
                    onFlag={handleFlag}
                    onAddComment={handleAddComment}
                    selectedReport={selectedReport}
                    onCloseModal={() => setSelectedReport(null)}
                    onReportAgain={() => setCurrentScreen('report')}
                    onLanguageChange={handleLanguageChange}
                  />
                </motion.div>
              )}

              {currentScreen === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="fk-screen-content w-full"
                >
                  <AnalyticsScreen
                    reports={reports}
                    user={user}
                    layoutMode={layoutMode}
                  />
                </motion.div>
              )}

              {currentScreen === 'report' && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="fk-screen-content w-full"
                >
                  <ReportScreen
                    user={user}
                    layoutMode={layoutMode}
                    onSubmit={handleSubmitReport}
                    onCancel={() => setCurrentScreen('home')}
                  />
                </motion.div>
              )}

              {currentScreen === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="fk-screen-content w-full"
                >
                  <NotificationsPage />
                </motion.div>
              )}

              {currentScreen === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="fk-screen-content w-full"
                >
                  <ProfileScreen
                    reports={reports.filter(r => r.userId === authUser?.uid)}
                    user={user}
                    layoutMode={layoutMode}
                    onLanguageChange={handleLanguageChange}
                    onToggleOnline={() => setUser(prev => ({ ...prev, isOnline: !prev.isOnline }))}
                    onReportAgain={() => setCurrentScreen('report')}
                  />
                </motion.div>
              )}

              {currentScreen === 'map' && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full"
                >
                  <LeafletMapScreen
                    reports={reports}
                    user={user}
                    layoutMode={layoutMode}
                    onReportSelect={setSelectedReport}
                    onUpvote={handleUpvote}
                    onVerify={handleVerify}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </React.Suspense>
        </div>

        <Toaster />

        {/* Global Detail Modal / Panel */}
        <AnimatePresence>
          {activeReport && (
            <>
              {/* Backdrop — mobile */}
              <motion.div
                className="fk-mobile-only"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReport(null)}
              />

              {/* Panel */}
              <motion.div
                style={{
                  position: 'fixed',
                  zIndex: 9999,
                  background: '#0A1628',
                  overflowY: 'auto',
                }}
                className="fk-detail-panel"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              >
                {/* Panel Header */}
                <div
                  style={{
                    position: 'sticky', top: 0,
                    padding: '16px 20px',
                    background: 'rgba(10,22,40,0.95)',
                    borderBottom: '1px solid rgba(0,212,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 10,
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {(() => {
                        const catColor = categoryColors[activeReport.type] || '#00D4FF';
                        const Icon = categoryIcons[activeReport.type] || MapPin;
                        return (
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${catColor}20`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: catColor }} />
                          </div>
                        );
                      })()}
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0F4FF', lineHeight: 1.3 }}>
                        {activeReport.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: 12, color: '#4A6080' }}>
                      {activeReport.ward} • {activeReport.street} • {formatTimeAgo(activeReport.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    style={{ padding: 8, borderRadius: 10, background: 'rgba(0,212,255,0.08)', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <X className="w-4 h-4" style={{ color: '#8BA3C7' }} />
                  </button>
                </div>

                <div style={{ padding: '20px' }}>
                  {/* Status + Priority */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {(() => {
                      const s = getStatusStyle(activeReport.status);
                      return (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, background: s.bg, color: s.color }}>
                          {s.text}
                        </span>
                      );
                    })()}
                    {activeReport.priority === 'high' && (
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}>
                        {t.highPriority}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#4A6080', padding: '6px 0', marginLeft: 'auto' }}>
                      {formatTimeAgo(activeReport.timestamp)}
                    </span>
                  </div>

                  {/* Location */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 12, marginBottom: 16,
                      background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)',
                    }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: '#00D4FF', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>
                        {activeReport.ward}, {activeReport.street}
                      </p>
                      <p style={{ fontSize: 11, color: '#4A6080', marginTop: 2 }}>
                        {activeReport.coordinates.lat.toFixed(4)}, {activeReport.coordinates.lng.toFixed(4)}
                        {activeReport.distance > 0 && ` • ${activeReport.distance.toFixed(1)}${t.kmAway}`}
                      </p>
                    </div>
                  </div>

                  {/* Image */}
                  {activeReport.imageUrl && (
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        borderRadius: 12,
                        overflow: 'hidden',
                        marginBottom: 16,
                        border: '1px solid rgba(0, 212, 255, 0.1)',
                        background: 'rgba(0, 212, 255, 0.02)',
                      }}
                    >
                      <img
                        src={activeReport.imageUrl}
                        alt={activeReport.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Description */}
                  <p style={{ fontSize: 14, color: '#C8D8F0', lineHeight: 1.65, marginBottom: 16 }}>
                    {activeReport.description}
                  </p>

                  {/* AI Tag */}
                  <div
                    style={{
                      padding: '12px 14px', borderRadius: 12, marginBottom: 20,
                      background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#00D4FF', fontWeight: 600 }}>⚙️ AI Classification</span>
                      <span style={{ fontSize: 12, color: '#00D4FF' }}>{activeReport.aiConfidence}% confidence</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(0,212,255,0.1)', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${activeReport.aiConfidence}%`, background: 'linear-gradient(90deg, #00D4FF, #0077BB)' }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#4A6080', marginTop: 6 }}>{activeReport.aiTag}</p>
                  </div>

                  {/* Community Verification System */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 16,
                      marginBottom: 20,
                      background: activeReport.flag_count && activeReport.flag_count >= 3 ? 'rgba(255,59,59,0.06)' : 'rgba(0,200,150,0.04)',
                      border: `1px solid ${activeReport.flag_count && activeReport.flag_count >= 3 ? 'rgba(255,59,59,0.15)' : 'rgba(0,200,150,0.12)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🛡️ {user.language === 'ur' ? 'کمیونٹی تصدیق' : 'Community Validation'}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: activeReport.flag_count && activeReport.flag_count >= 3 ? 'rgba(255,59,59,0.15)' : 'rgba(0,200,150,0.15)',
                          color: activeReport.flag_count && activeReport.flag_count >= 3 ? '#FF3B3B' : '#00C896'
                        }}
                      >
                        {activeReport.flag_count && activeReport.flag_count >= 3
                          ? (user.language === 'ur' ? 'مشکوک / غلط رپورٹ' : 'Flagged/Suspicious')
                          : (activeReport.verify_count ?? 0) >= 5
                            ? (user.language === 'ur' ? 'کمیونٹی سے تصدیق شدہ ✓' : 'Community Verified ✓')
                            : (user.language === 'ur' ? 'تصدیق کا انتظار' : 'Awaiting Validation')}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: '#8BA3C7', lineHeight: 1.4, marginBottom: 12 }}>
                      {activeReport.flag_count && activeReport.flag_count >= 3
                        ? (user.language === 'ur' 
                            ? 'انتباہ: شہریوں کی جانب سے اس مسئلے کو غلط یا نامناسب قرار دیا گیا ہے۔' 
                            : 'Warning: This issue has been flagged multiple times by citizens as inappropriate or fake.')
                        : (user.language === 'ur'
                            ? 'شہریوں کی مدد کریں۔ اگر مسئلہ واقعی موجود ہے تو تصدیق کریں، یا غلط ہونے کی صورت میں رپورٹ کریں۔'
                            : 'Help municipal workers prioritize this issue. Verify if it is real, or flag it if it is spam or incorrect.')}
                    </p>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {/* Verify Button */}
                      <motion.button
                        onClick={() => handleVerify(activeReport.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '11px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: activeReport.hasUserVerified ? 'rgba(0,200,150,0.15)' : 'rgba(0,212,255,0.06)',
                          color: activeReport.hasUserVerified ? '#00C896' : '#8BA3C7',
                          border: `1px solid ${activeReport.hasUserVerified ? 'rgba(0,200,150,0.3)' : 'rgba(0,212,255,0.12)'}`,
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" style={{ color: activeReport.hasUserVerified ? '#00C896' : '#8BA3C7' }} />
                        {user.language === 'ur' ? 'تصدیق' : 'Verify'} ({activeReport.verify_count || 0})
                      </motion.button>

                      {/* Flag/Spam Button */}
                      <motion.button
                        onClick={() => {
                          handleFlag(activeReport.id);
                          setSelectedReport(null);
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '11px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: 'rgba(255,59,59,0.06)',
                          color: '#FF3B3B',
                          border: '1px solid rgba(255,59,59,0.15)',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Flag className="w-3.5 h-3.5" style={{ color: '#FF3B3B' }} />
                        {user.language === 'ur' ? 'غلط رپورٹ' : 'Flag Spam'} ({activeReport.flag_count || 0})
                      </motion.button>
                    </div>
                  </div>

                  {/* Comments */}
                  <h4 style={{ fontWeight: 700, color: '#F0F4FF', marginBottom: 12, fontSize: 14 }}>
                    💬 {t.comments} ({activeReport.comments?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {(activeReport.comments || []).map(comment => (
                      <div
                        key={comment.id}
                        style={{ padding: '12px 14px', borderRadius: 14, background: '#0F2040', border: '1px solid rgba(0,212,255,0.06)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#00D4FF' }}>{comment.author}</span>
                          <span style={{ fontSize: 11, color: '#4A6080' }}>{formatTimeAgo(comment.timestamp)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#B0C8E8' }}>{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add comment */}
                  <form onSubmit={(e) => handleCommentSubmit(e, activeReport.id)} style={{ display: 'flex', gap: 10 }}>
                    <input
                      placeholder={t.addComment}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="fk-input"
                      style={{ flex: 1, height: 44, borderRadius: 12, fontSize: 13 }}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      style={{
                        padding: '0 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: newComment.trim() ? 'linear-gradient(135deg, #00D4FF, #0099CC)' : 'rgba(0,212,255,0.08)',
                        color: newComment.trim() ? '#081223' : '#4A6080',
                        border: 'none', cursor: newComment.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {t.postComment}
                    </button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
    </Layout>
  );
}

function LandingPageSwitcher() {
  const { user } = useAuth();
  if (user) {
    return (
      <ProtectedRoute>
        <CitizenApp />
      </ProtectedRoute>
    );
  }
  return <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
          <Route path="/" element={<LandingPageSwitcher />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/transparency" element={<TransparencyScreen />} />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute adminOnly>
                <AdminApp />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/*"
            element={(
              <ProtectedRoute>
                <CitizenApp />
              </ProtectedRoute>
            )}
          />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

