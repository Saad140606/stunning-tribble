import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
import DesktopMobileNotice from './components/DesktopMobileNotice';
import { translations, Language, isRTL, getStoredLanguage, storeLanguage } from './components/translations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AdminApp } from './admin/AdminLayout';
import { TransparencyScreen } from './screens/TransparencyScreen';
import { SOSButton } from './components/SOSButton';
import { firestore, isFirebaseConfigured } from './lib/firebase';
import { findLocalDuplicate } from './utils/duplicateDetection';

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

export type Screen = 'onboarding' | 'home' | 'report' | 'map' | 'profile' | 'analytics';

function CitizenApp() {
  const { user: authUser } = useAuth();
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

  // Initialize with Karachi seed reports
  useEffect(() => {
    const initialReports: Report[] = [
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
        title: 'Garbage overflow near Empress Market',
        description: 'Multiple garbage bins overflowing near Empress Market. Creating health hazard and attracting stray animals. KMC sanitation needed.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'M.A. Jinnah Road',
        coordinates: { lat: 24.8620, lng: 67.0155 },
        distance: 1.2,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 91,
        status: 'inprogress',
        upvotes: 23,
        comments: [
          { id: '3', text: 'Health department should inspect', timestamp: new Date(), author: 'Dr. Fatima' },
        ],
        severity: 7,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Street lights out in DHA Phase 6',
        description: 'Entire block of street lights non-functional on Khayaban-e-Shahbaz. Area becomes unsafe after dark. Multiple complaints filed.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'DHA',
        street: 'Khayaban-e-Shahbaz',
        coordinates: { lat: 24.8030, lng: 67.0625 },
        distance: 2.1,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 96,
        status: 'resolved',
        upvotes: 15,
        comments: [
          { id: '4', text: 'Fixed! Thank you KMC', timestamp: new Date(), author: 'Imran Hussain' },
        ],
        severity: 6,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'low'
      },
      {
        id: '4',
        title: 'Water supply disruption in Gulshan',
        description: 'No water supply for 3 days in Gulshan-e-Iqbal Block 13. Residents facing severe hardship. Tanker mafia charging exorbitant prices.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Gulshan-e-Iqbal',
        street: 'Block 13, Rashid Minhas Road',
        coordinates: { lat: 24.9230, lng: 67.0935 },
        distance: 3.2,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 89,
        status: 'inprogress',
        upvotes: 67,
        comments: [
          { id: '5', text: 'Please restore water urgently!', timestamp: new Date(), author: 'Meera Bibi' },
          { id: '6', text: 'Children are suffering', timestamp: new Date(), author: 'Asif Raza' },
        ],
        severity: 10,
        type: 'water',
        hasUserUpvoted: true,
        priority: 'high'
      },
      {
        id: '5',
        title: 'Sewerage overflow in Lyari',
        description: 'Main sewerage line blocked causing flooding in streets. Urgent attention needed — health risk for residents.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        district: 'Karachi',
        ward: 'Lyari',
        street: 'Agra Taj Colony',
        coordinates: { lat: 24.8480, lng: 66.9875 },
        distance: 1.8,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        aiTag: 'Sewerage System',
        aiConfidence: 87,
        status: 'reported',
        upvotes: 34,
        comments: [
          { id: '7', text: 'Same issue every monsoon', timestamp: new Date(), author: 'Rafiq Ahmed' },
        ],
        severity: 8,
        type: 'sewerage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '6',
        title: 'Dangerous road near PECHS',
        description: 'Road surface completely broken on Tariq Road. Multiple accidents reported. Emergency repair needed.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'PECHS',
        street: 'Tariq Road',
        coordinates: { lat: 24.8715, lng: 67.0531 },
        distance: 0.9,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 93,
        status: 'reported',
        upvotes: 56,
        comments: [],
        severity: 9,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '7',
        title: 'Street crime hotspot near Korangi',
        description: 'Multiple snatching incidents reported near Korangi Industrial Area. Area has no CCTV coverage and poor lighting.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Korangi',
        street: 'Korangi Industrial Area',
        coordinates: { lat: 24.8390, lng: 67.1312 },
        distance: 4.5,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        aiTag: 'Safety Concern',
        aiConfidence: 85,
        status: 'reported',
        upvotes: 89,
        comments: [
          { id: '8', text: 'Need police patrol here', timestamp: new Date(), author: 'Hassan Malik' },
        ],
        severity: 10,
        type: 'safety',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '8',
        title: 'Garbage pile-up in North Karachi',
        description: 'Massive garbage accumulation at 11-C bus stop. No collection for over a week. Strong odor affecting shops.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'North Karachi',
        street: 'Sector 11-C',
        coordinates: { lat: 24.9710, lng: 67.0558 },
        distance: 5.1,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 92,
        status: 'inprogress',
        upvotes: 31,
        comments: [],
        severity: 7,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '9',
        title: 'Broken water main in Clifton',
        description: 'Water main burst on Clifton Block 5. Water wasted for hours, road flooded. KW&SB not responding.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Clifton',
        street: 'Block 5, Sea View Road',
        coordinates: { lat: 24.8138, lng: 67.0244 },
        distance: 2.3,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 90,
        status: 'reported',
        upvotes: 42,
        comments: [
          { id: '9', text: 'This has been going on since morning', timestamp: new Date(), author: 'Nadia Shah' },
        ],
        severity: 8,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '10',
        title: 'Streetlight pole fallen in Federal B Area',
        description: 'Electric pole fallen after storm near Karimabad. Live wires exposed, extremely dangerous for pedestrians.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Federal B Area',
        street: 'Karimabad, Block 3',
        coordinates: { lat: 24.9285, lng: 67.0398 },
        distance: 3.5,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 95,
        status: 'reported',
        upvotes: 78,
        comments: [
          { id: '10', text: 'Very dangerous! Kids play here', timestamp: new Date(), author: 'Zubair Ahmed' },
        ],
        severity: 10,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '11',
        title: 'Sewerage flooding in Orangi Town',
        description: 'Sewerage overflow covering entire street in Sector 14. Residents cannot leave homes. Urgent pumping required.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        district: 'Karachi',
        ward: 'Orangi',
        street: 'Sector 14, Orangi Town',
        coordinates: { lat: 24.9350, lng: 66.9734 },
        distance: 6.2,
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
        aiTag: 'Sewerage System',
        aiConfidence: 88,
        status: 'inprogress',
        upvotes: 45,
        comments: [],
        severity: 9,
        type: 'sewerage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '12',
        title: 'Pothole cluster on University Road',
        description: 'Series of deep potholes near NED University entrance. Causing traffic gridlock during peak hours.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Gulshan-e-Iqbal',
        street: 'University Road',
        coordinates: { lat: 24.9260, lng: 67.1100 },
        distance: 3.8,
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 94,
        status: 'reported',
        upvotes: 63,
        comments: [
          { id: '11', text: 'NED students face this daily', timestamp: new Date(), author: 'Ali Haider' },
        ],
        severity: 8,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '13',
        title: 'No street lights in Malir Cantt',
        description: 'Entire stretch of road from Malir Cantt check post to Kala Board has no functioning lights.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Malir',
        street: 'National Highway, Malir',
        coordinates: { lat: 24.8907, lng: 67.2067 },
        distance: 8.0,
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 91,
        status: 'resolved',
        upvotes: 19,
        comments: [],
        severity: 6,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '14',
        title: 'Garbage burning near Nazimabad',
        description: 'Residents burning garbage at empty plot in Nazimabad No. 3. Toxic smoke affecting nearby school children.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Nazimabad',
        street: 'Nazimabad No. 3',
        coordinates: { lat: 24.9125, lng: 67.0310 },
        distance: 4.0,
        timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 88,
        status: 'reported',
        upvotes: 38,
        comments: [
          { id: '12', text: 'My children cannot breathe', timestamp: new Date(), author: 'Samina Begum' },
        ],
        severity: 9,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '15',
        title: 'Road cave-in near Landhi',
        description: 'Road partially collapsed near Landhi No. 2. Heavy vehicles diverted but motorbikes still using it dangerously.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Landhi',
        street: 'Landhi No. 2',
        coordinates: { lat: 24.8500, lng: 67.1500 },
        distance: 5.5,
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 96,
        status: 'inprogress',
        upvotes: 52,
        comments: [],
        severity: 10,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '16',
        title: 'Water tanker mafia in Gulistan-e-Johar',
        description: 'Water supply cut for 5 days. Tanker mafia selling water at Rs 5000 per tanker. KW&SB pipeline needs repair.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Gulistan-e-Johar',
        street: 'Block 15, Johar',
        coordinates: { lat: 24.9100, lng: 67.1254 },
        distance: 4.8,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 87,
        status: 'reported',
        upvotes: 94,
        comments: [
          { id: '13', text: 'We need KW&SB action now!', timestamp: new Date(), author: 'Kamran Shah' },
        ],
        severity: 10,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '17',
        title: 'Missing manhole cover in PECHS',
        description: 'Open manhole on Shahrah-e-Quaideen near Nursery. No warning signs. Extremely dangerous at night.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        district: 'Karachi',
        ward: 'PECHS',
        street: 'Shahrah-e-Quaideen',
        coordinates: { lat: 24.8700, lng: 67.0480 },
        distance: 1.5,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        aiTag: 'Safety Concern',
        aiConfidence: 93,
        status: 'reported',
        upvotes: 71,
        comments: [
          { id: '14', text: 'A child fell in last week!', timestamp: new Date(), author: 'Bushra Zaidi' },
        ],
        severity: 10,
        type: 'safety',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '18',
        title: 'Garbage collection missed in Clifton',
        description: 'No garbage collection for 4 days in Clifton Block 2. Bins overflowing, attracting flies and rats.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Clifton',
        street: 'Block 2, Clifton',
        coordinates: { lat: 24.8150, lng: 67.0280 },
        distance: 2.0,
        timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 90,
        status: 'resolved',
        upvotes: 28,
        comments: [],
        severity: 6,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '19',
        title: 'Broken water pipe in DHA Phase 5',
        description: 'Underground water pipe leaking on Sunset Boulevard. Wasting thousands of gallons daily. Road also damaged.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'DHA',
        street: 'Sunset Boulevard, Phase 5',
        coordinates: { lat: 24.8050, lng: 67.0580 },
        distance: 2.8,
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 91,
        status: 'inprogress',
        upvotes: 35,
        comments: [],
        severity: 7,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '20',
        title: 'Mugging hotspot near North Karachi',
        description: 'Frequent mobile snatching incidents near Power House Chowrangi. No police presence, poor lighting.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'North Karachi',
        street: 'Power House Chowrangi',
        coordinates: { lat: 24.9680, lng: 67.0600 },
        distance: 5.0,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        aiTag: 'Safety Concern',
        aiConfidence: 82,
        status: 'reported',
        upvotes: 103,
        comments: [
          { id: '15', text: 'My phone was snatched here yesterday', timestamp: new Date(), author: 'Tariq Mehmood' },
          { id: '16', text: 'Need CCTV cameras installed', timestamp: new Date(), author: 'Ayesha Kareem' },
        ],
        severity: 10,
        type: 'safety',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '21',
        title: 'Open drain outside Jinnah Hospital',
        description: 'Broken drain cover near the emergency gate is causing foul smell and risk for patients.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        district: 'Karachi',
        ward: 'Saddar',
        street: 'Rafiqui H.J. Shaheed Road',
        coordinates: { lat: 24.8553, lng: 67.0439 },
        distance: 1.1,
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        aiTag: 'Sewerage System',
        aiConfidence: 91,
        status: 'reported',
        upvotes: 36,
        comments: [],
        severity: 9,
        type: 'sewerage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '22',
        title: 'Street flooding at NIPA intersection',
        description: 'Rainwater remains pooled near NIPA for hours and blocks two service lanes.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Gulshan-e-Iqbal',
        street: 'NIPA Chowrangi',
        coordinates: { lat: 24.9176, lng: 67.0971 },
        distance: 3.4,
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        aiTag: 'Drainage',
        aiConfidence: 88,
        status: 'inprogress',
        upvotes: 58,
        comments: [],
        severity: 8,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '23',
        title: 'Garbage pile near Boat Basin food street',
        description: 'Waste has not been collected from the service lane and is spilling onto parking spots.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Clifton',
        street: 'Boat Basin',
        coordinates: { lat: 24.8272, lng: 67.0299 },
        distance: 2.6,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 94,
        status: 'reported',
        upvotes: 44,
        comments: [],
        severity: 7,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '24',
        title: 'Signal outage at Shah Faisal Colony',
        description: 'Traffic signal is dead near the main roundabout causing long queues.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Shah Faisal',
        street: 'Shah Faisal Colony Roundabout',
        coordinates: { lat: 24.8824, lng: 67.1591 },
        distance: 6.2,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        aiTag: 'Traffic Safety',
        aiConfidence: 86,
        status: 'reported',
        upvotes: 29,
        comments: [],
        severity: 8,
        type: 'safety',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '25',
        title: 'Broken road shoulder in Model Colony',
        description: 'Road edge has collapsed near the bus stop and motorcyclists are swerving suddenly.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Model Colony',
        street: 'Malir Halt Road',
        coordinates: { lat: 24.8924, lng: 67.1878 },
        distance: 7.5,
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 93,
        status: 'inprogress',
        upvotes: 51,
        comments: [],
        severity: 8,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '26',
        title: 'No street lights in Surjani Sector 7D',
        description: 'Four poles are out on the main lane and residents avoid walking after sunset.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Surjani Town',
        street: 'Sector 7D',
        coordinates: { lat: 25.0101, lng: 67.0666 },
        distance: 9.1,
        timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 92,
        status: 'reported',
        upvotes: 64,
        comments: [],
        severity: 7,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '27',
        title: 'Water main leak near Tariq Road',
        description: 'Clean water is leaking continuously from a cracked pipeline beside the shops.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'PECHS',
        street: 'Tariq Road Service Lane',
        coordinates: { lat: 24.8738, lng: 67.0594 },
        distance: 1.0,
        timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000),
        aiTag: 'Water Supply',
        aiConfidence: 90,
        status: 'reported',
        upvotes: 47,
        comments: [],
        severity: 8,
        type: 'water',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '28',
        title: 'Industrial waste dumping in SITE',
        description: 'Waste bags and chemical containers are dumped near the service road.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'SITE Area',
        street: 'SITE Service Road',
        coordinates: { lat: 24.8986, lng: 66.9963 },
        distance: 5.7,
        timestamp: new Date(Date.now() - 13 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 89,
        status: 'reported',
        upvotes: 39,
        comments: [],
        severity: 9,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '29',
        title: 'Manhole cover missing in Liaquatabad',
        description: 'Open manhole beside the market has no barricade and is hidden in traffic.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        district: 'Karachi',
        ward: 'Liaquatabad',
        street: 'Liaquatabad No. 10',
        coordinates: { lat: 24.9141, lng: 67.0449 },
        distance: 3.9,
        timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000),
        aiTag: 'Safety Concern',
        aiConfidence: 95,
        status: 'reported',
        upvotes: 88,
        comments: [],
        severity: 10,
        type: 'safety',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '30',
        title: 'Potholes on Korangi Crossing',
        description: 'Multiple potholes on the turning lane are slowing buses and heavy vehicles.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'Korangi',
        street: 'Korangi Crossing',
        coordinates: { lat: 24.8246, lng: 67.1430 },
        distance: 4.6,
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 92,
        status: 'inprogress',
        upvotes: 72,
        comments: [],
        severity: 8,
        type: 'pothole',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '31',
        title: 'Sewerage smell near Orangi Metro stop',
        description: 'Blocked sewer line is overflowing behind the stop and affecting nearby shops.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        district: 'Karachi',
        ward: 'Orangi',
        street: 'Orangi Metro Stop',
        coordinates: { lat: 24.9464, lng: 66.9849 },
        distance: 6.6,
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
        aiTag: 'Sewerage System',
        aiConfidence: 87,
        status: 'reported',
        upvotes: 33,
        comments: [],
        severity: 7,
        type: 'sewerage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '32',
        title: 'Streetlight restored near Malir Halt',
        description: 'Lights on the pedestrian stretch have been repaired after citizen reports.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
        district: 'Karachi',
        ward: 'Malir',
        street: 'Malir Halt',
        coordinates: { lat: 24.8846, lng: 67.1811 },
        distance: 7.7,
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
        aiTag: 'Street Lighting',
        aiConfidence: 90,
        status: 'resolved',
        upvotes: 21,
        comments: [],
        severity: 5,
        type: 'streetlight',
        hasUserUpvoted: false,
        priority: 'low'
      },
      {
        id: '33',
        title: 'Garbage container overflow in Buffer Zone',
        description: 'Container is full and waste is blocking the side lane near the mosque.',
        imageUrl: 'https://images.unsplash.com/photo-1609771405106-23d93a049d8b?w=400',
        district: 'Karachi',
        ward: 'Buffer Zone',
        street: 'Sector 15-A/1',
        coordinates: { lat: 24.9478, lng: 67.0648 },
        distance: 5.8,
        timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
        aiTag: 'Waste Management',
        aiConfidence: 91,
        status: 'reported',
        upvotes: 54,
        comments: [],
        severity: 7,
        type: 'garbage',
        hasUserUpvoted: false,
        priority: 'medium'
      },
      {
        id: '34',
        title: 'Road cut left open in Defence Phase 2',
        description: 'Utility work trench was left uncovered and cars are bottoming out.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        district: 'Karachi',
        ward: 'DHA',
        street: 'Khayaban-e-Ittehad',
        coordinates: { lat: 24.8109, lng: 67.0551 },
        distance: 2.9,
        timestamp: new Date(Date.now() - 34 * 60 * 60 * 1000),
        aiTag: 'Road Infrastructure',
        aiConfidence: 94,
        status: 'reported',
        upvotes: 46,
        comments: [],
        severity: 8,
        type: 'road',
        hasUserUpvoted: false,
        priority: 'high'
      },
      {
        id: '35',
        title: 'Water pressure failure in Gulberg',
        description: 'Residents report no pressure on upper floors for the third consecutive day.',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        district: 'Karachi',
        ward: 'Gulberg',
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
    setReports(initialReports);
  }, []);

  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

  const handleAddReport = (newReport: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'>) => {
    const duplicate = findLocalDuplicate(reports, {
      type: newReport.type,
      coordinates: newReport.coordinates,
    });
    const t = translations[user.language];

    if (duplicate) {
      toast.error('Possible duplicate report detected', {
        description: `Within ${duplicate.distanceMeters}m. Please upvote the existing report #${duplicate.id.slice(-4)}.`
      });
      return;
    }

    const report: Report = {
      ...newReport,
      id: Date.now().toString(),
      timestamp: new Date(),
      upvotes: 0,
      comments: [],
      distance: Math.random() * 3,
      hasUserUpvoted: false
    };

    if (user.isOnline) {
      setReports(prev => [report, ...prev]);
      if (isFirebaseConfigured) {
        addDoc(collection(firestore, 'reports'), {
          ...newReport,
          category: newReport.type,
          submittedBy: authUser?.uid ?? 'current-user',
          createdAt: serverTimestamp(),
          status: newReport.status,
          lat: newReport.coordinates.lat,
          lng: newReport.coordinates.lng,
        }).catch(() => undefined);
      }
      toast.success(
        `🎉 ${t.reportSubmitted} #${report.id.slice(-4)}`,
        {
          description: `Routed to ${getDepartmentName(report.type)} for processing`,
          duration: 4000,
        }
      );
    } else {
      toast.info(t.savedOffline);
      setTimeout(() => {
        if (user.isOnline) {
          setReports(prev => [report, ...prev]);
          toast.success(t.syncComplete);
        }
      }, 3000);
    }

    setCurrentScreen('home');
  };

  const getDepartmentName = (issueType: string) => {
    const departments: Record<string, string> = {
      'pothole': 'KMC Roads Department',
      'road': 'KMC Roads Department',
      'garbage': 'Sindh Solid Waste Management',
      'streetlight': 'K-Electric',
      'water': 'KW&SB Water Board',
      'sewerage': 'KW&SB Sewerage Division',
      'drainage': 'KW&SB Sewerage Division',
      'safety': 'Sindh Police / Rangers',
    };
    return departments[issueType.toLowerCase()] || 'KMC';
  };

  const handleUpvote = (reportId: string) => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const hasUpvoted = report.hasUserUpvoted;
        const nextUpvotes = hasUpvoted ? report.upvotes - 1 : report.upvotes + 1;
        const emergencyThreshold = 50;
        const isEmergency = nextUpvotes >= emergencyThreshold;
        const priorityScore = report.severity * 10 + nextUpvotes * 2;
        const priority = isEmergency || priorityScore >= 140 ? 'high' : priorityScore >= 90 ? 'medium' : 'low';
        return {
          ...report,
          upvotes: nextUpvotes,
          hasUserUpvoted: !hasUpvoted,
          priority,
          status: isEmergency ? 'emergency' : report.status
        };
      }
      return report;
    }));
  };

  const handleAddComment = (reportId: string, commentText: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText,
      timestamp: new Date(),
      author: 'You'
    };

    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const updatedReport = {
          ...report,
          comments: [...report.comments, newComment]
        };
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(updatedReport);
        }
        return updatedReport;
      }
      return report;
    }));
  };

  const handleLanguageChange = (language: Language) => {
    setUser(prev => ({ ...prev, language }));
    storeLanguage(language);
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
    <div className="min-h-screen bg-background w-full mx-auto relative mobile-container">
      <DesktopMobileNotice />
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
              onSubmit={handleAddReport}
              onCancel={() => setCurrentScreen('home')}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              reports={reports.filter(r => r.userId === 'current-user')}
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

      <BottomNavigation
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        language={user.language}
      />

      <SOSButton />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  );
}
