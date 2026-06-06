import React, { useState, useEffect } from 'react';
import {
  Search, Heart, MessageCircle, Flag, X, MapPin, Clock, Bell,
  AlertTriangle, Trash2, Lightbulb, Droplets, ShieldAlert, Zap,
  Filter, ChevronDown, TrendingUp, CheckCircle2, Activity, Plus,
  ArrowUpRight, BarChart2, Flame, ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report, Comment, User } from '../App';
import { translations, Language } from './translations';
import { FloatingActionButton } from './FloatingActionButton';
import { useAuth } from '../context/AuthContext';
import { flagReportAsSpam } from '../utils/spamFlags';
import { ReportCardSkeleton } from './ui/loading';

interface HomeScreenProps {
  reports: Report[];
  user: User;
  onReportSelect: (report: Report) => void;
  onUpvote: (reportId: string) => void;
  onVerify: (reportId: string) => void;
  onFlag: (reportId: string) => void;
  onAddComment: (reportId: string, comment: string) => void;
  selectedReport: Report | null;
  onCloseModal: () => void;
  onReportAgain: () => void;
  onLanguageChange: (language: Language) => void;
  isLoading?: boolean;
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

type SortMode = 'priority' | 'newest' | 'upvotes';
type FilterTab = 'all' | 'reported' | 'inprogress' | 'resolved' | 'emergency';

export function HomeScreen({
  reports,
  user,
  onReportSelect,
  onUpvote,
  onVerify,
  onFlag,
  onAddComment,
  selectedReport,
  onCloseModal,
  onReportAgain,
  onLanguageChange,
  isLoading = false,
}: HomeScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { user: authUser } = useAuth();

  const t = translations[user.language];

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
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

  const getPriorityScore = (r: Report) =>
    r.severity * 10 + r.upvotes * 2 + (r.status === 'emergency' ? 80 : 0);

  const filteredReports = reports
    .filter(r => r.district === user.district)
    .filter(r => filterTab === 'all' || r.status === filterTab)
    .filter(r =>
      searchTerm === '' ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.street.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === 'newest') return b.timestamp.getTime() - a.timestamp.getTime();
      if (sortMode === 'upvotes') return b.upvotes - a.upvotes;
      const sd = getPriorityScore(b) - getPriorityScore(a);
      return sd !== 0 ? sd : b.timestamp.getTime() - a.timestamp.getTime();
    });

  const totalReported = reports.filter(r => r.district === user.district).length;
  const totalResolved = reports.filter(r => r.district === user.district && r.status === 'resolved').length;
  const todayCount = reports.filter(r => {
    const today = new Date();
    return r.district === user.district && r.timestamp.toDateString() === today.toDateString();
  }).length;
  const emergencyCount = reports.filter(r => r.district === user.district && r.status === 'emergency').length;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && selectedReport) {
      onAddComment(selectedReport.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleFlag = async (reportId: string) => {
    onFlag(reportId);
    onCloseModal();
  };

  const filterTabs: Array<{ id: FilterTab; label: string; color: string }> = [
    { id: 'all', label: 'All', color: '#00D4FF' },
    { id: 'emergency', label: '🚨 Emergency', color: '#FF3B3B' },
    { id: 'reported', label: 'Reported', color: '#FF6B35' },
    { id: 'inprogress', label: 'In Progress', color: '#FFB800' },
    { id: 'resolved', label: 'Resolved', color: '#00C896' },
  ];

  const sortLabels: Record<SortMode, string> = {
    priority: '🔥 Priority',
    newest: '🕐 Newest',
    upvotes: '❤️ Most Voted',
  };

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh' }}>
      {/* ── Desktop/Mobile Header ── */}
      <div
        className="sticky top-0 z-40"
        style={{ background: 'rgba(10,22,40,0.95)', borderBottom: '1px solid rgba(0,212,255,0.08)', backdropFilter: 'blur(12px)' }}
      >
        <div style={{ padding: '16px 20px' }}>
          {/* Top row — mobile brand + actions */}
          <div className="flex items-center justify-between mb-4 fk-mobile-only">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #00D4FF, #0077BB)',
                  display: 'grid', placeItems: 'center',
                  boxShadow: '0 4px 16px rgba(0,212,255,0.3)',
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 12, color: '#081223' }}>FK</span>
              </div>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 17, color: '#F0F4FF', lineHeight: 1 }}>Fix Karachi</h1>
                <p style={{ fontSize: 10, color: '#4A6080', marginTop: 2 }}>Civic Command Center</p>
              </div>
            </div>
            <button
              onClick={() => onLanguageChange(user.language === 'en' ? 'ur' : 'en')}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'rgba(0,212,255,0.1)', color: '#00D4FF',
                border: '1px solid rgba(0,212,255,0.2)',
              }}
            >
              {user.language === 'en' ? 'اردو' : 'EN'}
            </button>
          </div>

          {/* Desktop page title */}
          <div className="hidden" style={{ display: 'none' }}>
            {/* Desktop title lives in fk-desktop-nav */}
          </div>

          {/* Stats row */}
          <div className="fk-stat-grid mb-4">
            {[
              { value: totalReported, label: t.reportsCount, color: '#00D4FF', icon: Activity },
              { value: totalResolved, label: t.resolvedCount, color: '#00C896', icon: CheckCircle2 },
              { value: todayCount, label: t.todayCount, color: '#FFB800', icon: TrendingUp },
              { value: emergencyCount, label: 'Emergency', color: '#FF3B3B', icon: Flame },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  style={{
                    background: '#0F2040',
                    border: '1px solid rgba(0,212,255,0.08)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  whileHover={{ borderColor: `${stat.color}30`, y: -1 }}
                >
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${stat.color}15`,
                      border: `1px solid ${stat.color}25`,
                      display: 'grid', placeItems: 'center',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 22, color: stat.color, lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#4A6080', marginTop: 3 }}>{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Search + Sort */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                className="absolute w-4 h-4"
                style={{ color: '#4A6080', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                placeholder={t.search}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="fk-input"
                style={{ paddingLeft: 42, width: '100%', height: 44, borderRadius: 12 }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSortMenu(v => !v)}
                style={{
                  height: 44, padding: '0 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
                  background: '#0F2040', border: '1px solid rgba(0,212,255,0.12)',
                  color: '#8BA3C7', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden" style={{ display: window.innerWidth >= 600 ? 'inline' : 'none' }}>
                  {sortLabels[sortMode]}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: '#0F2040', border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: 14, padding: 6, minWidth: 160, zIndex: 100,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    }}
                  >
                    {(Object.keys(sortLabels) as SortMode[]).map(s => (
                      <button
                        key={s}
                        onClick={() => { setSortMode(s); setShowSortMenu(false); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                          color: sortMode === s ? '#00D4FF' : '#8BA3C7',
                          background: sortMode === s ? 'rgba(0,212,255,0.1)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >
                        {sortLabels[s]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="fk-scroll-x" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '7px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600,
                  whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.15s ease',
                  background: filterTab === tab.id ? `${tab.color}20` : 'rgba(255,255,255,0.04)',
                  color: filterTab === tab.id ? tab.color : '#5A7090',
                  border: `1px solid ${filterTab === tab.id ? `${tab.color}40` : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {tab.label}
                {tab.id !== 'all' && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                    {reports.filter(r => r.district === user.district && r.status === tab.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reports Feed ── */}
      <div style={{ padding: '16px 20px 100px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: 15, color: '#F0F4FF' }}>
            {t.latestReports}
            <span style={{ marginLeft: 8, fontSize: 12, color: '#4A6080', fontWeight: 400 }}>
              ({filteredReports.length})
            </span>
          </h2>
          <button
            onClick={onReportAgain}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
              color: '#081223', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              border: 'none', boxShadow: '0 4px 16px rgba(0,212,255,0.3)',
            }}
          >
            <Plus className="w-4 h-4" />
            Report
          </button>
        </div>

        {isLoading ? (
          <ReportCardSkeleton count={5} />
        ) : (
          <div className="fk-feed-grid">
            {filteredReports.map((report, index) => {
              const catColor = categoryColors[report.type] || '#00D4FF';
              const CategoryIcon = categoryIcons[report.type] || MapPin;
              const status = getStatusStyle(report.status);
              const isEmergency = report.status === 'emergency';

              return (
                <motion.div
                  key={report.id}
                  onClick={() => onReportSelect(report)}
                  style={{
                    background: '#0F2040',
                    border: `1px solid ${isEmergency ? 'rgba(255,59,59,0.3)' : 'rgba(0,212,255,0.08)'}`,
                    borderLeft: `4px solid ${catColor}`,
                    borderRadius: 18,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    ...(isEmergency ? { boxShadow: '0 0 24px rgba(255,59,59,0.15)' } : {}),
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
                  whileHover={{ y: -3, borderColor: isEmergency ? 'rgba(255,59,59,0.5)' : 'rgba(0,212,255,0.2)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ padding: '16px 18px' }}>
                    {/* Category + Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `${catColor}18`, border: `1px solid ${catColor}30`,
                          display: 'grid', placeItems: 'center',
                        }}
                      >
                        <CategoryIcon className="w-4 h-4" style={{ color: catColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', lineHeight: 1.3, marginBottom: 4 }}>
                          {report.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4A6080' }}>
                          <MapPin className="w-3 h-3" />
                          <span>{report.ward} • {report.street}</span>
                        </div>
                      </div>
                      {isEmergency && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,59,59,0.2)', color: '#FF3B3B', flexShrink: 0 }}>
                          🚨 EMERGENCY
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="line-clamp-2" style={{ fontSize: 13, color: '#8BA3C7', lineHeight: 1.5, marginBottom: 12 }}>
                      {report.description}
                    </p>

                    {/* AI confidence bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10, color: '#4A6080' }}>
                        <span>⚙️ {report.aiTag}</span>
                        <span style={{ color: catColor }}>{report.aiConfidence}% match</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${report.aiConfidence}%`, background: `linear-gradient(90deg, ${catColor}, ${catColor}88)`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>

                    {/* Bottom row: status + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: status.bg, color: status.color }}>
                          {status.text}
                        </span>
                        {report.priority === 'high' && !isEmergency && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,107,53,0.12)', color: '#FF6B35' }}>
                            HIGH
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Upvote */}
                        <motion.button
                          onClick={e => { e.stopPropagation(); onUpvote(report.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: report.hasUserUpvoted ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                            color: report.hasUserUpvoted ? '#00D4FF' : '#4A6080',
                            border: `1px solid ${report.hasUserUpvoted ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.08)'}`,
                            cursor: 'pointer',
                          }}
                          whileTap={{ scale: 1.2 }}
                        >
                          <Heart className="w-3.5 h-3.5" fill={report.hasUserUpvoted ? '#00D4FF' : 'none'} />
                          <span style={{ fontFamily: "'JetBrains Mono'" }}>{report.upvotes}</span>
                        </motion.button>

                        {/* Verify */}
                        <motion.button
                          onClick={e => { e.stopPropagation(); onVerify(report.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: report.hasUserVerified ? 'rgba(0,200,150,0.15)' : 'rgba(0,200,150,0.05)',
                            color: report.hasUserVerified ? '#00C896' : '#4A6080',
                            border: `1px solid ${report.hasUserVerified ? 'rgba(0,200,150,0.3)' : 'rgba(0,200,150,0.08)'}`,
                            cursor: 'pointer',
                          }}
                          whileTap={{ scale: 1.2 }}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" fill={report.hasUserVerified ? '#00C896' : 'none'} />
                          <span style={{ fontFamily: "'JetBrains Mono'" }}>{report.verify_count || 0}</span>
                        </motion.button>

                        {/* Comments */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4A6080' }}>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{report.comments.length}</span>
                        </div>

                        {/* Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#4A6080' }}>
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(report.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredReports.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '64px 20px' }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏙️</div>
            <p style={{ color: '#4A6080', fontSize: 15, fontWeight: 500 }}>{t.noReports}</p>
            <p style={{ color: '#2A4060', fontSize: 13, marginTop: 8 }}>
              {searchTerm ? 'Try a different search term' : 'Be the first to report an issue in your area'}
            </p>
            <button
              onClick={onReportAgain}
              style={{
                marginTop: 24, padding: '12px 28px', borderRadius: 14,
                background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
                color: '#081223', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none',
                boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
              }}
            >
              + Report an Issue
            </button>
          </motion.div>
        )}
      </div>

      {/* FAB — mobile only */}
      <FloatingActionButton
        onReportClick={onReportAgain}
        onQuickPhotoClick={onReportAgain}
        isVisible={true}
      />

      {/* ── Detail Modal / Panel ── */}
      <AnimatePresence>
        {selectedReport && (
          <>
            {/* Backdrop — mobile */}
            <motion.div
              className="fk-mobile-only"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseModal}
            />

            {/* Panel */}
            <motion.div
              style={{
                position: 'fixed',
                zIndex: 9999,
                background: '#0A1628',
                overflowY: 'auto',
                // mobile: full screen slide from right
                // desktop: right panel
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
                      const catColor = categoryColors[selectedReport.type] || '#00D4FF';
                      const Icon = categoryIcons[selectedReport.type] || MapPin;
                      return (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${catColor}20`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: catColor }} />
                        </div>
                      );
                    })()}
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0F4FF', lineHeight: 1.3 }}>
                      {selectedReport.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: 12, color: '#4A6080' }}>
                    {selectedReport.ward} • {selectedReport.street} • {formatTimeAgo(selectedReport.timestamp)}
                  </p>
                </div>
                <button
                  onClick={onCloseModal}
                  style={{ padding: 8, borderRadius: 10, background: 'rgba(0,212,255,0.08)', cursor: 'pointer', flexShrink: 0 }}
                >
                  <X className="w-4 h-4" style={{ color: '#8BA3C7' }} />
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Status + Priority */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {(() => {
                    const s = getStatusStyle(selectedReport.status);
                    return (
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, background: s.bg, color: s.color }}>
                        {s.text}
                      </span>
                    );
                  })()}
                  {selectedReport.priority === 'high' && (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}>
                      {t.highPriority}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#4A6080', padding: '6px 0', marginLeft: 'auto' }}>
                    {formatTimeAgo(selectedReport.timestamp)}
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
                      {selectedReport.ward}, {selectedReport.street}
                    </p>
                    <p style={{ fontSize: 11, color: '#4A6080', marginTop: 2 }}>
                      {selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)}
                      {selectedReport.distance > 0 && ` • ${selectedReport.distance.toFixed(1)}${t.kmAway}`}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#C8D8F0', lineHeight: 1.65, marginBottom: 16 }}>
                  {selectedReport.description}
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
                    <span style={{ fontSize: 12, color: '#00D4FF' }}>{selectedReport.aiConfidence}% confidence</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(0,212,255,0.1)', borderRadius: 2 }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${selectedReport.aiConfidence}%`, background: 'linear-gradient(90deg, #00D4FF, #0077BB)' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#4A6080', marginTop: 6 }}>{selectedReport.aiTag}</p>
                </div>

                {/* Community Verification System */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 16,
                    marginBottom: 20,
                    background: selectedReport.flag_count && selectedReport.flag_count >= 3 ? 'rgba(255,59,59,0.06)' : 'rgba(0,200,150,0.04)',
                    border: `1px solid ${selectedReport.flag_count && selectedReport.flag_count >= 3 ? 'rgba(255,59,59,0.15)' : 'rgba(0,200,150,0.12)'}`,
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
                        background: selectedReport.flag_count && selectedReport.flag_count >= 3 ? 'rgba(255,59,59,0.15)' : 'rgba(0,200,150,0.15)',
                        color: selectedReport.flag_count && selectedReport.flag_count >= 3 ? '#FF3B3B' : '#00C896'
                      }}
                    >
                      {selectedReport.flag_count && selectedReport.flag_count >= 3
                        ? (user.language === 'ur' ? 'مشکوک / غلط رپورٹ' : 'Flagged/Suspicious')
                        : (selectedReport.verify_count ?? 0) >= 5
                          ? (user.language === 'ur' ? 'کمیونٹی سے تصدیق شدہ ✓' : 'Community Verified ✓')
                          : (user.language === 'ur' ? 'تصدیق کا انتظار' : 'Awaiting Validation')}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: 12, color: '#8BA3C7', lineHeight: 1.4, marginBottom: 12 }}>
                    {selectedReport.flag_count && selectedReport.flag_count >= 3
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
                      onClick={() => onVerify(selectedReport.id)}
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
                        background: selectedReport.hasUserVerified ? 'rgba(0,200,150,0.15)' : 'rgba(0,212,255,0.06)',
                        color: selectedReport.hasUserVerified ? '#00C896' : '#8BA3C7',
                        border: `1px solid ${selectedReport.hasUserVerified ? 'rgba(0,200,150,0.3)' : 'rgba(0,212,255,0.12)'}`,
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" style={{ color: selectedReport.hasUserVerified ? '#00C896' : '#8BA3C7' }} />
                      {user.language === 'ur' ? 'تصدیق' : 'Verify'} ({selectedReport.verify_count || 0})
                    </motion.button>
                    
                    {/* Flag/Spam Button */}
                    <motion.button
                      onClick={() => handleFlag(selectedReport.id)}
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
                      {user.language === 'ur' ? 'غلط رپورٹ' : 'Flag Spam'} ({selectedReport.flag_count || 0})
                    </motion.button>
                  </div>
                </div>

                {/* Comments */}
                <h4 style={{ fontWeight: 700, color: '#F0F4FF', marginBottom: 12, fontSize: 14 }}>
                  💬 {t.comments} ({selectedReport.comments.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {selectedReport.comments.map(comment => (
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
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10 }}>
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

      <style>{`
        .fk-detail-panel {
          right: 0;
          top: 0;
          bottom: 0;
          width: 100%;
          max-width: 420px;
        }
        @media (min-width: 900px) {
          .fk-detail-panel {
            width: 460px;
            border-left: 1px solid rgba(0,212,255,0.1);
            box-shadow: -24px 0 60px rgba(0,0,0,0.4);
          }
        }
      `}</style>
    </div>
  );
}
