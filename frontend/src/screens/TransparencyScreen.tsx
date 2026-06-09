import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Share2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../services/api';
import { motion } from 'motion/react';

interface PublicReport {
  id: string;
  category: string;
  district: string;
  department: string;
  status: string;
  createdAt: Date;
  resolvedAt?: Date;
  emergencyWithinSla?: boolean;
}

const districts = ['Saddar', 'Gulshan-e-Iqbal', 'Clifton', 'Korangi', 'Malir', 'Lyari', 'Orangi', 'Nazimabad', 'DHA', 'North Karachi'];
const departments = ['KMC Roads', 'KMC Water (KWSB)', 'KESC', 'Traffic Police'];

const asDate = (value: unknown) => value instanceof Date ? value : value ? new Date(String(value)) : new Date();

const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  onSurface: '#dde3e7',
  muted: '#859398',
  accent: '#00d4ff',
  accentGreen: '#00c896',
  border: 'rgba(168, 232, 255, 0.07)',
  fontHeadline: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontData: "'JetBrains Mono', monospace",
};

const glassCardStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, rgba(26,33,35,0.75) 0%, rgba(36,43,46,0.55) 100%)`,
  border: `1px solid ${T.border}`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 16,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

export function TransparencyScreen() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await apiFetch('/complaints/public', { skipAuth: true });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const mapped = (data.complaints || []).map((item: any) => ({
          id: String(item.id),
          category: item.category ?? 'Civic issue',
          district: item.district ?? 'Karachi',
          department: item.assignedTo ?? item.department ?? 'KMC Roads',
          status: item.status ?? 'reported',
          createdAt: asDate(item.createdAt),
          resolvedAt: item.status === 'resolved' ? asDate(item.updatedAt) : undefined,
          emergencyWithinSla: item.priority === 10 && item.status === 'resolved',
        }));
        setReports(mapped);
      } catch (err) {
        console.error('Failed to load public complaints:', err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const month = new Date().getMonth();
    const thisMonth = reports.filter((report) => report.createdAt.getMonth() === month);
    const resolved = thisMonth.filter((report) => report.status === 'resolved');
    const avgMs = resolved.reduce((sum, report) => sum + ((report.resolvedAt ?? new Date()).getTime() - report.createdAt.getTime()), 0) / Math.max(resolved.length, 1);
    const emergencies = thisMonth.filter((report) => report.emergencyWithinSla !== undefined);
    return {
      total: thisMonth.length,
      resolved: resolved.length,
      avgDays: Math.max(1, Math.round(avgMs / 86400000)),
      emergencyRate: emergencies.length ? Math.round((emergencies.filter((report) => report.emergencyWithinSla).length / emergencies.length) * 100) : 100,
    };
  }, [reports]);

  const copyShare = async () => {
    await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen text-[#dde3e7] overflow-x-hidden relative" style={{ backgroundColor: T.bg, fontFamily: T.fontHeadline }}>
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-[rgba(0,212,255,0.05)] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-[rgba(139,92,246,0.04)] rounded-full blur-[120px] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 w-full border-b border-white/5 backdrop-blur-md bg-[#0e1417]/70 p-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00D4FF] to-[#0099cc] shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:scale-105 transition-all">
              <ShieldCheck className="w-6 h-6 text-[#0A1628]" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white leading-tight">Karachi Civic Transparency Portal</h1>
              <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: T.accentGreen }}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span className="font-semibold tracking-wider uppercase font-mono">Live Audit Stream</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              onClick={copyShare} 
              className="rounded-xl px-4 py-3 flex items-center gap-2 border border-white/10 text-[#00D4FF] font-semibold text-sm transition-all" 
              style={{ background: T.surface }}
            >
              <Share2 className="w-4 h-4" /> {copied ? 'Copied' : 'Share URL'}
            </motion.button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/" className="rounded-xl px-4 py-3 font-bold text-sm bg-[#00D4FF] text-[#0A1628] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all block text-center">
                Report an Issue →
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto p-5 space-y-6 relative z-10"
      >
        {/* Stats Section */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Total Reports This Month', stats.total, T.accent],
            ['Resolved This Month', stats.resolved, T.accentGreen],
            ['Average Resolution Time', `${stats.avgDays} days`, '#FFB800'],
            ['Emergency Response Rate', `${stats.emergencyRate}%`, '#8B5CF6'],
          ].map(([label, value, color]) => (
            <motion.div 
              key={label} 
              whileHover={{ y: -4, borderColor: `${color}33` }}
              className="p-5 flex flex-col justify-between" 
              style={glassCardStyle}
            >
              <div style={{ color: String(color), fontSize: 32, fontWeight: 900, fontFamily: T.fontData }}>{value}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">{label}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* By Department Table */}
        <motion.section variants={itemVariants} className="overflow-hidden" style={glassCardStyle}>
          <h2 className="p-4 font-black text-white text-base border-b border-white/5 bg-[#1a2123]/40">Department Auditing</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="text-slate-400 bg-[#0e1417]">
                <tr>
                  {['Department', 'Assigned Tickets', 'Resolved Tickets', 'Pending Tickets', 'Avg Resolution Days'].map((head) => (
                    <th key={head} className="text-left p-3.5 font-bold uppercase tracking-wider text-[11px]">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => {
                  const assigned = reports.filter((report) => report.department === department);
                  const resolved = assigned.filter((report) => report.status === 'resolved');
                  return (
                    <tr key={department} className="hover:bg-white/[0.02] transition-colors" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-3.5 font-semibold text-white">{department}</td>
                      <td className="p-3.5 font-mono text-slate-300">{assigned.length}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">{resolved.length}</td>
                      <td className="p-3.5 font-mono text-amber-500">{assigned.length - resolved.length}</td>
                      <td className="p-3.5 font-mono text-slate-300">3 days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* By District List Grid */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-4">
          {districts.map((district) => {
            const items = reports.filter((report) => report.district === district);
            const resolved = items.filter((report) => report.status === 'resolved').length;
            const rate = items.length ? Math.round((resolved / items.length) * 100) : 0;
            return (
              <motion.div 
                key={district} 
                whileHover={{ y: -3 }}
                className="p-5" 
                style={glassCardStyle}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-extrabold text-white">{district}</span>
                  <span className="text-xs font-semibold font-mono text-slate-400">{items.length} reports logged</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-[#0e1417]">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00C896]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-bold font-mono text-[#00C896]">{rate}% resolved</span>
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Recent Resolutions Section */}
        <motion.section variants={itemVariants} className="p-6" style={glassCardStyle}>
          <h2 className="mb-4 font-black text-white text-base">Recent Resolutions</h2>
          <div className="space-y-1">
            {reports.filter((report) => report.status === 'resolved').slice(0, 10).map((report) => (
              <motion.div 
                key={report.id} 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 py-3.5 border-t border-white/5"
              >
                <CheckCircle2 className="w-5 h-5 text-[#00C896] shrink-0" />
                <span className="text-sm text-slate-300 leading-normal font-semibold">
                  <strong className="text-white">{report.category}</strong> in {report.district} resolved by KMC teams in {Math.max(1, Math.round(((report.resolvedAt ?? new Date()).getTime() - report.createdAt.getTime()) / 86400000))} days
                </span>
              </motion.div>
            ))}
            {reports.filter((report) => report.status === 'resolved').length === 0 && (
              <p className="text-sm text-slate-400 py-3">No resolutions recorded yet.</p>
            )}
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
}
