import React from 'react';
import { Settings, Wifi, WifiOff, User, MapPin, LogOut, Clock, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Report, User as UserType } from '../App';
import { translations, Language } from './translations';
import { useAuth } from '../context/AuthContext';

interface ProfileScreenProps {
  reports: Report[];
  user: UserType;
  onLanguageChange: (language: Language) => void;
  onToggleOnline: () => void;
  onReportAgain: () => void;
}

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ProfileScreen({
  reports,
  user,
  onLanguageChange,
  onToggleOnline,
  onReportAgain
}: ProfileScreenProps) {
  const t = translations[user.language];
  const { isAdmin, signOut, profile } = useAuth();

  const getStatusStyle = (status: Report['status']) => {
    switch (status) {
      case 'reported': return { bg: 'rgba(255,107,53,0.15)', color: '#FF6B35', text: t.statusReported };
      case 'inprogress': return { bg: 'rgba(255,184,0,0.15)', color: '#FFB800', text: t.statusInProgress };
      case 'resolved': return { bg: 'rgba(0,200,150,0.15)', color: '#00C896', text: t.statusResolved };
      default: return { bg: 'rgba(0,212,255,0.1)', color: '#8BA3C7', text: status };
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    return `${diffDays} ${t.daysAgo}`;
  };

  // Mock user reports
  const userReports: Report[] = [
    {
      id: '101', title: 'Broken streetlight near bus stop', description: 'Streetlight non-functional for 3 days',
      imageUrl: '', district: user.district, ward: 'Clifton', street: 'Sea View Road',
      coordinates: user.coordinates, distance: 0.1, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      aiTag: 'Streetlight', aiConfidence: 94, status: 'inprogress' as const, upvotes: 15, comments: [],
      severity: 6, type: 'streetlight', userId: 'current-user', hasUserUpvoted: false,
    },
    {
      id: '102', title: 'Garbage overflow in residential area', description: 'Multiple bins overflowing',
      imageUrl: '', district: user.district, ward: 'Gulshan-e-Iqbal', street: 'Block 13',
      coordinates: user.coordinates, distance: 0.5, timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
      aiTag: 'Garbage', aiConfidence: 89, status: 'resolved' as const, upvotes: 8, comments: [],
      severity: 7, type: 'garbage', userId: 'current-user', hasUserUpvoted: false,
    },
    {
      id: '103', title: 'Pothole on main road', description: 'Large pothole causing traffic issues',
      imageUrl: '', district: user.district, ward: 'PECHS', street: 'Tariq Road',
      coordinates: user.coordinates, distance: 0.8, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      aiTag: 'Road', aiConfidence: 96, status: 'reported' as const, upvotes: 23, comments: [],
      severity: 8, type: 'pothole', userId: 'current-user', hasUserUpvoted: false,
    },
  ];

  const totalUpvotes = userReports.reduce((sum, r) => sum + r.upvotes, 0);
  const resolvedCount = userReports.filter(r => r.status === 'resolved').length;

  return (
    <motion.div className="min-h-screen" style={{ background: '#0A1628' }} variants={pageVariants} initial="hidden" animate="show">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-4"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '20px', color: '#F0F4FF' }}>
          {t.profile}
        </h1>
      </div>

      <motion.div className="p-4 space-y-4" variants={itemVariants}>
        {/* User Info Card */}
        <motion.div
          className="rounded-2xl p-5"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
                boxShadow: '0 0 20px rgba(0,212,255,0.2)',
              }}
            >
              <span style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '20px', fontWeight: 800, color: '#0A1628' }}>FK</span>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F4FF' }}>{profile?.phone ?? 'Demo User'}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3" style={{ color: '#00D4FF' }} />
                <span style={{ fontSize: '13px', color: '#8BA3C7' }}>{t.karachiCitizen}</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: userReports.length, label: t.reportsSubmitted },
              { value: totalUpvotes, label: t.verified },
              { value: resolvedCount, label: t.resolved },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '20px', fontWeight: 700, color: '#00D4FF' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '10px', color: '#4A6080', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Language Toggle */}
        <motion.div
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, duration: 0.35 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" style={{ color: '#00D4FF' }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#F0F4FF' }}>{t.language}</span>
            </div>
            <div
              className="flex rounded-full overflow-hidden"
              style={{ border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <button
                className="px-4 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: user.language === 'en' ? '#00D4FF' : 'transparent',
                  color: user.language === 'en' ? '#0A1628' : '#4A6080',
                }}
                onClick={() => onLanguageChange('en')}
              >
                EN
              </button>
              <button
                className="px-4 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: user.language === 'ur' ? '#00D4FF' : 'transparent',
                  color: user.language === 'ur' ? '#0A1628' : '#4A6080',
                  fontFamily: "'Noto Nastaliq Urdu', serif",
                }}
                onClick={() => onLanguageChange('ur')}
              >
                اردو
              </button>
            </div>
          </div>
        </motion.div>

        {/* Online/Offline Toggle */}
        <motion.div
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.isOnline ? (
                <Wifi className="w-4 h-4" style={{ color: '#00C896' }} />
              ) : (
                <WifiOff className="w-4 h-4" style={{ color: '#FF6B35' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#F0F4FF' }}>
                {user.isOnline ? t.onlineMode : t.offlineMode}
              </span>
            </div>
            <button
              onClick={onToggleOnline}
              className="w-12 h-6 rounded-full relative transition-all"
              style={{
                background: user.isOnline ? '#00C896' : '#1A3050',
              }}
            >
              <motion.div
                className="w-5 h-5 rounded-full absolute top-0.5"
                style={{ background: '#FFF' }}
                animate={{ left: user.isOnline ? '26px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          <Link
            to="/transparency"
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
            style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            View Public Dashboard →
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
              style={{ background: '#00D4FF', color: '#0A1628' }}
            >
              Admin Panel
            </Link>
          )}
        </motion.div>

        {/* My Reports */}
        <motion.div
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21, duration: 0.35 }}
        >
          <h3 className="mb-4" style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF' }}>{t.myReports}</h3>

          <div className="space-y-3">
            {userReports.map((report) => {
              const status = getStatusStyle(report.status);
              return (
                <div
                  key={report.id}
                  className="rounded-xl p-3"
                  style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.06)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="flex-1 truncate" style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF' }}>
                      {report.title}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium ml-2"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3" style={{ fontSize: '11px', color: '#4A6080' }}>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{report.ward}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(report.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{report.upvotes}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {userReports.length === 0 && (
            <div className="text-center py-8">
              <p style={{ color: '#4A6080', fontSize: '13px', marginBottom: '12px' }}>{t.noReports}</p>
              <button
                onClick={onReportAgain}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                {t.report}
              </button>
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <motion.button
          onClick={signOut}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
          style={{
            background: 'rgba(255,59,59,0.08)',
            color: '#FF3B3B',
            border: '1px solid rgba(255,59,59,0.15)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.35 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
