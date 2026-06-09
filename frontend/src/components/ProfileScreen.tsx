import React from 'react';
import { Settings, Wifi, WifiOff, User, MapPin, LogOut, Clock, Heart, Award, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { LayoutMode, Report, User as UserType } from '../App';
import { translations, Language } from './translations';
import { useAuth } from '../context/AuthContext';

interface ProfileScreenProps {
  reports: Report[];
  user: UserType;
  onLanguageChange: (language: Language) => void;
  onToggleOnline: () => void;
  onReportAgain: () => void;
  layoutMode?: LayoutMode;
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
  onReportAgain,
  layoutMode = 'mobile',
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

  const userReports = reports;

  const totalUpvotes = userReports.reduce((sum, r) => sum + r.upvotes, 0);
  const resolvedCount = userReports.filter(r => r.status === 'resolved').length;

  const userInitials = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user.name.substring(0, 2).toUpperCase();

  return (
    <motion.div className="pb-12 bg-[#0e1417] min-h-screen pt-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.div className="p-6 max-w-7xl mx-auto" variants={itemVariants}>
        
        {/* Welcome Banner */}
        <div className="bg-[#1a2123]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#00d4ff]/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-[#e8f4f8] mb-2 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {user.language === 'ur' ? 'خوش آمدید' : 'Welcome'}, <span className="text-[#00d4ff]">{profile?.full_name?.split(' ')[0] ?? 'Citizen'}</span>
              </h1>
              <p className="text-slate-300 text-lg">Here's your civic engagement overview for {profile?.city ?? user.district}.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-20 h-20 rounded-full flex items-center justify-center relative bg-gradient-to-br from-[#00d4ff] to-[#0088cc] shadow-[0_0_24px_rgba(0,212,255,0.3)]">
                  <span style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '28px', fontWeight: 800, color: '#0A1628' }}>
                    {userInitials}
                  </span>
                  <div className="absolute -bottom-1 -right-1 bg-[#00C896] text-[#0A1628] rounded-full p-1 border-2 border-[#0F2040]">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Card & Settings (Span 4) */}
          <div className="lg:col-span-4 space-y-6">

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

          {/* Right Column - Stats Grid & Reports Feed (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: userReports.length, label: t.reportsSubmitted, icon: MapPin, color: '#00d4ff' },
                { value: resolvedCount, label: t.resolved, icon: Shield, color: '#00c896' },
                { value: totalUpvotes, label: 'Impact Score', icon: Award, color: '#ffb800' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#1a2123]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-[#1a2123]/80 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00d4ff]/10 to-transparent rounded-bl-full opacity-50"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 font-medium text-sm tracking-wide uppercase">{stat.label}</h3>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10" style={{ color: stat.color }}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-4xl font-black text-[#e8f4f8] tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              className="rounded-3xl p-6 bg-[#1a2123]/60 backdrop-blur-xl border border-white/5"
              style={{ minHeight: '400px' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#e8f4f8]">Recent Activity</h3>
                
                <span className="text-xs text-[#00d4ff] font-mono bg-[#00d4ff]/10 px-3 py-1.5 rounded-full border border-[#00d4ff]/20 font-bold tracking-wide">
                  {userReports.length} {user.language === 'ur' ? 'رپورٹس' : 'Reports'}
                </span>
              </div>

              <div className="space-y-4">
                {userReports.map((report) => {
                  const status = getStatusStyle(report.status);
                  return (
                    <motion.div
                      key={report.id}
                      className="rounded-2xl p-5 transition-all hover:bg-white/5 mb-4 group cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-slate-300 group-hover:text-[#00d4ff] group-hover:bg-[#00d4ff]/10 transition-colors">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#e8f4f8] text-base leading-tight">
                              {report.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">{report.ward}</p>
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border"
                          style={{ background: status.bg, color: status.color, borderColor: `${status.color}30` }}
                        >
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                        {report.description}
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeAgo(report.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{report.upvotes} Upvotes</span>
                          </div>
                        </div>
                        <button className="text-[#00d4ff] text-sm font-bold hover:text-[#00ff94] transition-colors">
                          View Details
                        </button>
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
