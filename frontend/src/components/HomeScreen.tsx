import React, { useState } from 'react';
import { Search, Heart, MessageCircle, Flag, X, MapPin, Clock, Bell, AlertTriangle, Trash2, Lightbulb, Droplets, ShieldAlert, Zap } from 'lucide-react';
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
  onAddComment: (reportId: string, comment: string) => void;
  selectedReport: Report | null;
  onCloseModal: () => void;
  onReportAgain: () => void;
  onLanguageChange: (language: Language) => void;
  isLoading?: boolean;
}

const categoryColors: Record<string, string> = {
  pothole: '#FF6B35',
  road: '#FF6B35',
  garbage: '#00C896',
  streetlight: '#FFB800',
  water: '#00D4FF',
  sewerage: '#8B5CF6',
  drainage: '#8B5CF6',
  safety: '#FF3B3B',
};

const categoryIconComponents: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  pothole: AlertTriangle,
  road: AlertTriangle,
  garbage: Trash2,
  streetlight: Lightbulb,
  water: Droplets,
  sewerage: Zap,
  drainage: Zap,
  safety: ShieldAlert,
};

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


export function HomeScreen({
  reports,
  user,
  onReportSelect,
  onUpvote,
  onAddComment,
  selectedReport,
  onCloseModal,
  onReportAgain,
  onLanguageChange,
  isLoading = false,
}: HomeScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const { user: authUser } = useAuth();

  const t = translations[user.language];

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

  const getPriorityScore = (report: Report) => {
    const statusBoost = report.status === 'emergency' ? 80 : 0;
    return report.severity * 10 + report.upvotes * 2 + statusBoost;
  };

  const filteredReports = reports
    .filter(report =>
      report.district === user.district &&
      (searchTerm === '' ||
       report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       report.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
       report.street.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const scoreDiff = getPriorityScore(b) - getPriorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  const totalReported = filteredReports.length;
  const totalResolved = filteredReports.filter(r => r.status === 'resolved').length;
  const todayCount = filteredReports.filter(r => {
    const today = new Date();
    return r.timestamp.toDateString() === today.toDateString();
  }).length;

  const handleUpvoteClick = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    onUpvote(reportId);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && selectedReport) {
      onAddComment(selectedReport.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleFlag = async (reportId: string) => {
    await flagReportAsSpam(reportId, authUser?.uid ?? 'demo-user');
    onCloseModal();
  };

  return (
    <motion.div className="min-h-screen" style={{ background: '#0A1628' }} variants={pageVariants} initial="hidden" animate="show">
      {/* Header */}
      <div
        className="sticky top-0 z-40"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #0088CC)' }}
              >
                <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '12px', color: '#0A1628' }}>FK</span>
              </div>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '18px', color: '#F0F4FF' }}>Fix Karachi</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onLanguageChange(user.language === 'en' ? 'ur' : 'en')}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(0,212,255,0.1)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0,212,255,0.2)',
                }}
              >
                {user.language === 'en' ? 'اردو' : 'EN'}
              </button>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.08)' }}
              >
                <Bell className="w-4 h-4" style={{ color: '#8BA3C7' }} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex gap-2 mb-3">
            {[
              { value: totalReported, label: t.reportsCount, color: '#00D4FF' },
              { value: totalResolved, label: t.resolvedCount, color: '#00C896' },
              { value: todayCount, label: t.todayCount, color: '#FFB800' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex-1 py-2 px-3 rounded-xl text-center"
                style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
              >
                <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: '18px', color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '10px', color: '#4A6080', marginTop: '2px' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#4A6080' }} />
            <input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm fk-input"
              style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)', color: '#F0F4FF' }}
            />
          </div>
        </div>
      </div>

      {/* Section Title */}
      <motion.div className="px-4 pt-3 pb-2" variants={itemVariants}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '16px', color: '#F0F4FF' }}>
          {t.latestReports}
        </h2>
      </motion.div>

      {/* Reports Feed */}
      {isLoading ? <ReportCardSkeleton count={5} /> : <div className="px-3 pb-4 space-y-3">
        {filteredReports.map((report, index) => {
          const catColor = categoryColors[report.type] || '#00D4FF';
          const CategoryIcon = categoryIconComponents[report.type] || MapPin;
          const status = getStatusStyle(report.status);

          return (
            <motion.div
              key={report.id}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: '#0F2040',
                border: '1px solid rgba(0,212,255,0.08)',
                borderLeft: `4px solid ${catColor}`,
              }}
              onClick={() => onReportSelect(report)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -2, borderColor: 'rgba(0,212,255,0.2)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-4">
                {/* Top: Category + Time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: `${catColor}15`, border: `1px solid ${catColor}30` }}
                    >
                      <CategoryIcon className="w-4 h-4" style={{ color: catColor }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F4FF' }}>
                      {report.title}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: '12px', color: '#4A6080' }}>
                  <MapPin className="w-3 h-3" />
                  <span>{report.ward} • {report.street}</span>
                </div>

                {/* Description */}
                <p className="line-clamp-2 mb-3" style={{ fontSize: '13px', color: '#8BA3C7', lineHeight: 1.5 }}>
                  {report.description}
                </p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.text}
                    </span>
                    {report.priority === 'high' && (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}
                      >
                        {t.highPriority}
                      </span>
                    )}

                    {/* Upvote */}
                    <motion.button
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: report.hasUserUpvoted ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                        color: report.hasUserUpvoted ? '#00D4FF' : '#4A6080',
                      }}
                      onClick={(e) => handleUpvoteClick(e, report.id)}
                      whileTap={{ scale: 1.15 }}
                    >
                      <Heart
                        className="w-3.5 h-3.5"
                        fill={report.hasUserUpvoted ? '#00D4FF' : 'none'}
                        style={{ color: report.hasUserUpvoted ? '#00D4FF' : '#4A6080' }}
                      />
                      <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{report.upvotes}</span>
                    </motion.button>

                    {/* Comments count */}
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#4A6080' }}>
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{report.comments.length}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1" style={{ fontSize: '11px', color: '#4A6080' }}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(report.timestamp)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="text-center py-16">
            <p style={{ color: '#4A6080', fontSize: '14px' }}>{t.noReports}</p>
          </div>
        )}
      </div>}

      {/* Floating Action Button */}
      <FloatingActionButton
        onReportClick={onReportAgain}
        onQuickPhotoClick={onReportAgain}
        isVisible={true}
      />

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            className="fixed inset-0 max-w-sm mx-auto z-[10000] overflow-y-auto"
            style={{ background: '#0A1628' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          >
            {/* Header */}
            <div
              className="sticky top-0 px-4 py-3 flex items-center justify-between z-10"
              style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
            >
              <div className="flex-1 min-w-0">
                <h3 className="truncate" style={{ fontSize: '15px', fontWeight: 600, color: '#F0F4FF' }}>
                  {selectedReport.title}
                </h3>
                <p className="truncate" style={{ fontSize: '12px', color: '#4A6080' }}>
                  {selectedReport.ward} • {selectedReport.street} • {formatTimeAgo(selectedReport.timestamp)}
                </p>
              </div>
              <button
                className="ml-2 p-2 rounded-lg"
                style={{ background: 'rgba(0,212,255,0.08)' }}
                onClick={onCloseModal}
              >
                <X className="w-4 h-4" style={{ color: '#8BA3C7' }} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Status + Time */}
              <div className="flex items-center justify-between">
                {(() => {
                  const s = getStatusStyle(selectedReport.status);
                  return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
                      {s.text}
                    </span>
                  );
                })()}
                {selectedReport.priority === 'high' && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}
                  >
                    {t.highPriority}
                  </span>
                )}
                <span style={{ fontSize: '12px', color: '#4A6080' }}>{formatTimeAgo(selectedReport.timestamp)}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#8BA3C7' }}>
                <MapPin className="w-4 h-4" style={{ color: '#00D4FF' }} />
                <span>{selectedReport.ward} • {selectedReport.street} • {selectedReport.distance.toFixed(1)}{t.kmAway}</span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '14px', color: '#F0F4FF', lineHeight: 1.6 }}>{selectedReport.description}</p>

              {/* AI Tag */}
              <div
                className="px-3 py-2 rounded-lg"
                style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.1)' }}
              >
                <span style={{ fontSize: '12px', color: '#00D4FF' }}>
                  🤖 {selectedReport.aiTag} — {selectedReport.aiConfidence}% {t.confidence}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                  style={{
                    background: selectedReport.hasUserUpvoted ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                    color: selectedReport.hasUserUpvoted ? '#00D4FF' : '#8BA3C7',
                    border: '1px solid rgba(0,212,255,0.1)',
                  }}
                  onClick={() => onUpvote(selectedReport.id)}
                  whileTap={{ scale: 1.05 }}
                >
                  <Heart className="w-4 h-4" fill={selectedReport.hasUserUpvoted ? '#00D4FF' : 'none'} />
                  {selectedReport.upvotes} {t.upvote}
                </motion.button>
                <button
                  onClick={() => handleFlag(selectedReport.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(0,212,255,0.05)', color: '#8BA3C7', border: '1px solid rgba(0,212,255,0.1)' }}
                >
                  <Flag className="w-4 h-4" />
                  Flag
                </button>
              </div>

              {/* Comments */}
              <div>
                <h4 style={{ fontWeight: 600, color: '#F0F4FF', marginBottom: '12px', fontSize: '14px' }}>{t.comments}</h4>
                <div className="space-y-3 mb-4">
                  {selectedReport.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl p-3"
                      style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.06)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF' }}>{comment.author}</span>
                        <span style={{ fontSize: '11px', color: '#4A6080' }}>{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#8BA3C7' }}>{comment.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    placeholder={t.addComment}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 py-2 px-3 rounded-xl text-sm fk-input"
                    style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)', color: '#F0F4FF' }}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity"
                    style={{
                      background: '#00D4FF',
                      color: '#0A1628',
                      opacity: newComment.trim() ? 1 : 0.4,
                    }}
                  >
                    {t.postComment}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
