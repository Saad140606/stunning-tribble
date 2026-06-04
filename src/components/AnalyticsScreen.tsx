import React from 'react';
import { BarChart3, CheckCircle, Clock, Timer, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Report, User } from '../App';
import { translations } from './translations';
import { useCountUp } from '../hooks/useCountUp';

interface AnalyticsScreenProps {
  reports: Report[];
  user: User;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '10px', padding: '10px 14px' }}>
        <p style={{ color: '#F0F4FF', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color, fontSize: '12px' }}>
            {entry.value} reports
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsScreen({ reports, user }: AnalyticsScreenProps) {
  const t = translations[user.language];

  const districtReports = reports.filter(r => r.district === user.district);
  const totalReports = districtReports.length;
  const resolvedCount = districtReports.filter(r => r.status === 'resolved').length;
  const pendingCount = districtReports.filter(r => r.status !== 'resolved').length;

  const animatedTotal = useCountUp(totalReports);
  const animatedResolved = useCountUp(resolvedCount);
  const animatedPending = useCountUp(pendingCount);
  const animatedAvg = useCountUp(48);

  const statsCards = [
    { title: t.totalReports, value: animatedTotal, icon: BarChart3, color: '#00D4FF' },
    { title: t.resolved, value: animatedResolved, icon: CheckCircle, color: '#00C896' },
    { title: t.pending, value: animatedPending, icon: Clock, color: '#FFB800' },
    { title: t.avgResolution, value: `${animatedAvg}h`, icon: Timer, color: '#8B5CF6' },
  ];

  // Category data for bar chart
  const categoryData = [
    { name: t.pothole, count: districtReports.filter(r => r.type === 'pothole').length || 5, fill: '#FF6B35' },
    { name: t.garbage, count: districtReports.filter(r => r.type === 'garbage').length || 4, fill: '#00C896' },
    { name: t.water, count: districtReports.filter(r => r.type === 'water').length || 5, fill: '#00D4FF' },
    { name: t.streetlight, count: districtReports.filter(r => r.type === 'streetlight').length || 3, fill: '#FFB800' },
    { name: t.sewerage, count: districtReports.filter(r => r.type === 'sewerage').length || 2, fill: '#8B5CF6' },
    { name: t.safety, count: districtReports.filter(r => r.type === 'safety').length || 3, fill: '#FF3B3B' },
  ];

  // Weekly trend data
  const weeklyData = [
    { day: 'Mon', reports: 12 },
    { day: 'Tue', reports: 19 },
    { day: 'Wed', reports: 15 },
    { day: 'Thu', reports: 22 },
    { day: 'Fri', reports: 18 },
    { day: 'Sat', reports: 8 },
    { day: 'Sun', reports: 5 },
  ];

  // Top problem areas
  const topAreas = [
    { name: 'Saddar', count: 156, color: '#FF6B35' },
    { name: 'Gulshan-e-Iqbal', count: 134, color: '#00D4FF' },
    { name: 'North Karachi', count: 121, color: '#FFB800' },
    { name: 'Lyari', count: 98, color: '#FF3B3B' },
    { name: 'PECHS', count: 87, color: '#00C896' },
  ];
  const maxAreaCount = Math.max(...topAreas.map(a => a.count));

  return (
    <div className="min-h-screen" style={{ background: '#0A1628' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-4"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '20px', color: '#F0F4FF' }}>
          {t.cityDashboard}
        </h1>
        <p style={{ fontSize: '13px', color: '#4A6080', marginTop: '2px' }}>
          {user.language === 'ur' ? 'شہری ڈیش بورڈ' : 'City Dashboard'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              className="rounded-2xl p-4"
              style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <div
                style={{ fontFamily: "'JetBrains Mono'", fontSize: '24px', fontWeight: 700, color: stat.color }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: '#4A6080', marginTop: '4px' }}>{stat.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Bar Chart */}
        <motion.div
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', marginBottom: '16px' }}>
            {t.reportsByCategory}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#4A6080', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <motion.rect key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Line Chart */}
        <motion.div
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', marginBottom: '16px' }}>
            {t.weeklyTrend}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#4A6080', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="reports"
                stroke="#00D4FF"
                strokeWidth={2}
                dot={{ fill: '#00D4FF', r: 4, strokeWidth: 2, stroke: '#0F2040' }}
                activeDot={{ r: 6, fill: '#00D4FF', stroke: '#0A1628', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Problem Areas */}
        <motion.div
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.35 }}
        >
          <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF' }}>
            <MapPin className="w-4 h-4" style={{ color: '#00D4FF' }} />
            {t.topProblemAreas}
          </h3>
          <div className="space-y-3">
            {topAreas.map((area, index) => (
              <motion.div
                key={area.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.07 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF' }}>{area.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '12px', fontWeight: 600, color: area.color }}>
                    {area.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(0,212,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: area.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(area.count / maxAreaCount) * 100}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}