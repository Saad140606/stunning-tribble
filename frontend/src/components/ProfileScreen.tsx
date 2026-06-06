import React from 'react';
import { Settings, Wifi, WifiOff, User, MapPin, LogOut, Clock, Heart, Award, Shield } from 'lucide-react';
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
      case 'emergency': return { bg: 'rgba(255,59,59,0.18)', color: '#FF3B3B', text: t.statusEmergency };
      case 'flagged': return { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6', text: t.statusFlagged };
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

  // Mock demo reports fallback for showcase
  const mockReports: Report[] = [
    {
      id: 'mock-1', title: 'Broken streetlight near bus stop', description: 'Streetlight non-functional for 3 days',
      imageUrl: '', district: user.district, ward: 'Clifton', street: 'Sea View Road',
      coordinates: user.coordinates, distance: 0.1, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      aiTag: 'Streetlight', aiConfidence: 94, status: 'inprogress' as const, upvotes: 15, comments: [],
      severity: 6, type: 'streetlight', userId: 'current-user', hasUserUpvoted: false,
    },
    {
      id: 'mock-2', title: 'Garbage overflow in residential area', description: 'Multiple bins overflowing',
      imageUrl: '', district: user.district, ward: 'Gulshan-e-Iqbal', street: 'Block 13',
      coordinates: user.coordinates, distance: 0.5, timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
      aiTag: 'Garbage', aiConfidence: 89, status: 'resolved' as const, upvotes: 8, comments: [],
      severity: 7, type: 'garbage', userId: 'current-user', hasUserUpvoted: false,
    },
  ];

  // Try to find current user's reports
  const realUserReports = reports.filter(
    r => r.userId === profile?.uid || String(r.id).startsWith('user_')
  );
  
  const userReports = realUserReports.length > 0 ? realUserReports : mockReports;

  const totalUpvotes = userReports.reduce((sum, r) => sum + r.upvotes, 0);
  const resolvedCount = userReports.filter(r => r.status === 'resolved').length;

  const userInitials = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'KC';

  return (
    <motion.div className="min-h-screen pb-12" style={{ background: '#0A1628' }} variants={pageVariants} initial="hidden" animate="show">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-6 py-4"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '22px', color: '#F0F4FF' }}>
          {t.profile}
        </h1>
      </div>

      <motion.div className="p-6 max-w-7xl mx-auto" variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column - Card & Settings (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* User Info Card */}
            <motion.div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center relative group"
                  style={{
                    background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
                    boxShadow: '0 0 24px rgba(0,212,255,0.2)',
                  }}
                >
                  <span style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '22px', fontWeight: 800, color: '#0A1628' }}>
                    {userInitials}
                  </span>
                  
                  {/* Verified Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-[#00C896] text-[#0A1628] rounded-full p-1 border-2 border-[#0F2040]">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>
                
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F0F4FF' }}>
                    {profile?.full_name ?? 'Karachi Citizen'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#00D4FF' }} />
                    <span style={{ fontSize: '13px', color: '#8BA3C7' }}>
                      {profile?.city ?? t.karachiCitizen} • {profile?.phone ?? 'Citizen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 bg-[rgba(10,22,40,0.4)] p-4 rounded-xl border border-[rgba(0,212,255,0.04)]">
                {[
                  { value: userReports.length, label: t.reportsSubmitted },
                  { value: totalUpvotes, label: t.verified },
                  { value: resolvedCount, label: t.resolved },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '22px', fontWeight: 700, color: '#00D4FF' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '10px', color: '#4A6080', marginTop: '2px', fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Account Settings Menu */}
            <div className="rounded-2xl p-6 space-y-5" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF' }} className="mb-2">
                {user.language === 'ur' ? 'اکاؤنٹ سیٹنگز' : 'Account Settings'}
              </h3>

              {/* Language Selector */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" style={{ color: '#00D4FF' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#F0F4FF' }}>{t.language}</span>
                </div>
                <div className="flex rounded-full overflow-hidden border border-[rgba(0,212,255,0.15)] bg-[#0A1628]">
                  <button
                    className="px-4 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: user.language === 'en' ? '#00D4FF' : 'transparent',
                      color: user.language === 'en' ? '#0A1628' : '#4A6080',
                    }}
                    onClick={() => onLanguageChange('en')}
                  >
                    EN
                  </button>
                  <button
                    className="px-4 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: user.language === 'ur' ? '#00D4FF' : 'transparent',
                      color: user.language === 'ur' ? '#0A1628' : '#4A6080',
                    }}
                    onClick={() => onLanguageChange('ur')}
                  >
                    اردو
                  </button>
                </div>
              </div>

              {/* Offline / Online Mode Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-[rgba(0,212,255,0.06)] pt-4">
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

              {/* Navigation Links / Actions */}
              <div className="space-y-3 pt-4 border-t border-[rgba(0,212,255,0.06)]">
                <Link
                  to="/transparency"
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-[rgba(0,212,255,0.15)] text-[#00D4FF] hover:bg-[rgba(0,212,255,0.04)] transition-all"
                  style={{ background: 'rgba(0,212,255,0.05)' }}
                >
                  {user.language === 'ur' ? 'پبلک ڈیش بورڈ دیکھیں ←' : 'View Public Dashboard →'}
                </Link>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#0A1628] hover:opacity-90 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #00D4FF, #0088CC)',
                      boxShadow: '0 4px 12px rgba(0,212,255,0.15)'
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={signOut}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255,59,59,0.08)',
                color: '#FF3B3B',
                border: '1px solid rgba(255,59,59,0.15)',
              }}
              whileHover={{ background: 'rgba(255,59,59,0.12)' }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-4 h-4" />
              {t.logout}
            </motion.button>
          </div>

          {/* Right Column - Reports Feed (Span 7) */}
          <div className="lg:col-span-7">
            <motion.div
              className="rounded-2xl p-6"
              style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)', minHeight: '400px' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FF' }}>{t.myReports}</h3>
                
                <span className="text-xs text-[#4A6080] font-mono bg-[rgba(255,255,255,0.03)] px-2.5 py-1 rounded-full border border-[rgba(255,255,255,0.05)]">
                  {userReports.length} {user.language === 'ur' ? 'رپورٹس' : 'Reports'}
                </span>
              </div>

              <div className="space-y-4">
                {userReports.map((report) => {
                  const status = getStatusStyle(report.status);
                  return (
                    <motion.div
                      key={report.id}
                      className="rounded-xl p-4 transition-all hover:translate-x-1"
                      style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.06)' }}
                      whileHover={{ borderColor: 'rgba(0,212,255,0.15)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="flex-1 font-semibold leading-tight text-[#F0F4FF]" style={{ fontSize: '14px' }}>
                          {report.title}
                        </h4>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold ml-3 whitespace-nowrap"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.text}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#8BA3C7' }} className="line-clamp-2 mb-3">
                        {report.description}
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-[rgba(0,212,255,0.04)] pt-3" style={{ fontSize: '11px', color: '#4A6080' }}>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{report.ward}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeAgo(report.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[#00D4FF] bg-[rgba(0,212,255,0.05)] px-2 py-0.5 rounded-md border border-[rgba(0,212,255,0.08)]">
                          <Heart className="w-3 h-3" fill="#00D4FF" />
                          <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{report.upvotes}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {userReports.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <User className="w-12 h-12 text-[#4A6080] mb-3 opacity-40" />
                    <p style={{ color: '#4A6080', fontSize: '14px', marginBottom: '16px' }}>{t.noReports}</p>
                    <button
                      onClick={onReportAgain}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
                      style={{
                        background: 'rgba(0,212,255,0.1)',
                        color: '#00D4FF',
                        border: '1px solid rgba(0,212,255,0.2)'
                      }}
                      whileHover={{ bg: 'rgba(0,212,255,0.15)' }}
                    >
                      {t.report}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
