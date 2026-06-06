import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { LoadingScreen } from './components/LoadingScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ReportScreen } from './components/ReportScreen';
import { LeafletMapScreen } from './components/LeafletMapScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { DesktopNavigation } from './components/DesktopNavigation';
import DesktopMobileNotice from './components/DesktopMobileNotice';
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
import { SOSButton } from './components/SOSButton';
import { findLocalDuplicate } from './utils/duplicateDetection';
import { apiFetch } from './services/api';
import { getQueuedComplaints, queueComplaint, removeQueuedComplaint } from './utils/offlineQueue';
import { NotificationBell } from './components/notifications/NotificationBell';
import { EmergencyAlertBanner } from './components/notifications/EmergencyAlertBanner';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { createNotification, updateUserNotificationLocation } from './services/notificationService';

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
  };
}

function CitizenApp() {
  const { user: authUser } = useAuth();
  const { notify } = useNotifications();
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

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
      });
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

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-background w-full mx-auto relative mobile-container">
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
    <div className="fk-app-shell mobile-container">
      <DesktopNavigation
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        onToggleLanguage={() => handleLanguageChange(user.language === 'en' ? 'ur' : 'en')}
        languageLabel={user.language === 'en' ? 'اردو' : 'EN'}
      />
      <div className="fk-app-content">
        <DesktopMobileNotice />
        <EmergencyAlertBanner />
        <div className="fixed top-3 right-3 z-[9999] fk-mobile-only">
          <NotificationBell onOpenHistory={() => setCurrentScreen('notifications')} />
        </div>
        <div className="fk-page">
          {currentScreen !== 'map' && (
            <div className="pb-20">
              {currentScreen === 'home' && (
                <HomeScreen
                  reports={reports}
                  user={user}
                  onReportSelect={setSelectedReport}
                  onUpvote={handleUpvote}
                  onAddComment={handleAddComment}
                  selectedReport={selectedReport}
                  onCloseModal={() => setSelectedReport(null)}
                  onReportAgain={() => setCurrentScreen('report')}
                  onLanguageChange={handleLanguageChange}
                />
              )}

              {currentScreen === 'analytics' && (
                <AnalyticsScreen
                  reports={reports}
                  user={user}
                />
              )}

              {currentScreen === 'report' && (
                <ReportScreen
                  user={user}
                  onSubmit={handleSubmitReport}
                  onCancel={() => setCurrentScreen('home')}
                />
              )}

              {currentScreen === 'notifications' && (
                <NotificationsPage />
              )}

              {/* FIX 1D: Filter by authUser?.uid (not hardcoded 'current-user') */}
              {currentScreen === 'profile' && (
                <ProfileScreen
                  reports={reports.filter(r => r.userId === authUser?.uid)}
                  user={user}
                  onLanguageChange={handleLanguageChange}
                  onToggleOnline={() => setUser(prev => ({ ...prev, isOnline: !prev.isOnline }))}
                  onReportAgain={() => setCurrentScreen('report')}
                />
              )}
            </div>
          )}

          {currentScreen === 'map' && (
            <LeafletMapScreen
              reports={reports}
              user={user}
              onReportSelect={setSelectedReport}
              onUpvote={handleUpvote}
            />
          )}
        </div>

        <div className="fk-mobile-only">
          <BottomNavigation
            currentScreen={currentScreen}
            onScreenChange={setCurrentScreen}
            language={user.language}
          />
        </div>

        <SOSButton />
        <Toaster />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
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
