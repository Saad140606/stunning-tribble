import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ArrowRight, MapPin, AlertCircle, 
  TrendingUp, Users, CheckCircle2, Shield, Activity,
  Globe, BarChart3, MessageSquare, ChevronRight, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  surfaceHigh: '#242b2e',
  onSurface: '#dde3e7',
  onSurfaceVariant: '#bbc9cf',
  muted: '#859398',
  accent: '#00d4ff',
  accentGreen: '#00c896',
  accentPurple: '#8b5cf6',
  accentAmber: '#FFB800',
  accentOrange: '#FF6B35',
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
      staggerChildren: 0.1,
      delayChildren: 0.05,
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

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Interactive mock card state
  const [mockStatus, setMockStatus] = useState<'reported' | 'inprogress' | 'resolved'>('reported');
  const [mockUpvotes, setMockUpvotes] = useState(47);

  useEffect(() => {
    const interval = setInterval(() => {
      setMockStatus(prev => {
        if (prev === 'reported') {
          return 'inprogress';
        } else if (prev === 'inprogress') {
          return 'resolved';
        } else {
          // Reset upvotes and return reported
          setMockUpvotes(47);
          return 'reported';
        }
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animate mock upvotes
  useEffect(() => {
    if (mockStatus === 'inprogress') {
      const t = setTimeout(() => setMockUpvotes(78), 1000);
      return () => clearTimeout(t);
    } else if (mockStatus === 'resolved') {
      setMockUpvotes(124);
    }
  }, [mockStatus]);

  return (
    <div className="min-h-screen text-[#dde3e7] overflow-x-hidden relative" style={{ backgroundColor: T.bg, fontFamily: T.fontHeadline }}>
      
      {/* Dynamic CSS Injector for Keyframes */}
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -60px) scale(1.15); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.25); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(0, 212, 255, 0.15); }
          50% { border-color: rgba(0, 212, 255, 0.4); }
        }
        @keyframes textGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-orb1 {
          animation: orbFloat1 20s infinite ease-in-out;
        }
        .animate-orb2 {
          animation: orbFloat2 25s infinite ease-in-out;
        }
        .glowing-border {
          animation: borderGlow 6s infinite ease-in-out;
        }
        .gradient-text-animate {
          background-size: 200% auto;
          animation: textGradient 6s infinite linear;
        }
      `}</style>

      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-[rgba(0,212,255,0.08)] rounded-full blur-[120px] animate-orb1" />
        <div className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] bg-[rgba(139,92,246,0.06)] rounded-full blur-[140px] animate-orb2" />
        <div className="absolute top-[40%] right-[5%] w-[300px] h-[300px] bg-[rgba(0,200,150,0.04)] rounded-full blur-[100px] animate-orb1" />
        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(${T.accent} 1px, transparent 1px), linear-gradient(90deg, ${T.accent} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Sticky frosted glass navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 backdrop-blur-md bg-[#0e1417]/70 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 z-50">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00D4FF] to-[#0099cc] shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              <ShieldCheck className="w-5.5 h-5.5 text-[#0A1628]" />
            </div>
            <span className="text-base font-extrabold text-white uppercase tracking-wider" style={{ fontFamily: T.fontHeadline }}>
              Fix Karachi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-[#00D4FF] transition-colors">Features</a>
            <Link to="/transparency" className="hover:text-[#00D4FF] transition-colors">Transparency Feed</Link>
            <a href="#stats" className="hover:text-[#00D4FF] transition-colors">Impact</a>
            <a href="#process" className="hover:text-[#00D4FF] transition-colors">How it works</a>
          </nav>

          {/* Desktop Auth CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-xs text-slate-400 font-medium font-mono">Signed in: {user.email.split('@')[0]}</span>
                <Link 
                  to={user.role === 'admin' || user.role === 'authority' ? '/admin' : '/'} 
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#0e1417] bg-gradient-to-r from-[#00D4FF] to-[#00C896] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300"
                >
                  Go to Platform
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#0e1417] bg-[#00D4FF] hover:bg-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300"
                >
                  Register / اندراج کریں
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors z-50 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-0 z-40 bg-[#0e1417] flex flex-col justify-center px-10 space-y-8"
            >
              <nav className="flex flex-col gap-6 text-2xl font-bold">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#00D4FF]">Features</a>
                <Link to="/transparency" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#00D4FF]">Transparency Feed</Link>
                <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#00D4FF]">Impact</a>
                <a href="#process" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#00D4FF]">How it works</a>
              </nav>
              <div className="h-[1px] bg-white/5 w-full" />
              <div className="flex flex-col gap-4">
                {user ? (
                  <Link 
                    to={user.role === 'admin' || user.role === 'authority' ? '/admin' : '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-4 text-center rounded-xl font-bold text-[#0e1417] bg-gradient-to-r from-[#00D4FF] to-[#00C896]"
                  >
                    Go to Platform
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-4 text-center rounded-xl font-bold text-white border border-white/10 hover:border-white/20"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-4 text-center rounded-xl font-bold text-[#0e1417] bg-[#00D4FF]"
                    >
                      Register / رجسٹریشن
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Text Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 space-y-8 text-center lg:text-left"
        >
          {/* Tag badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00d4ff]/5 text-[#00d4ff] text-xs font-semibold uppercase tracking-wider"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            Karachi Metropolitan Civic Node
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08] text-white"
          >
            Make your voice <br className="hidden md:inline" />
            heard. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#00C896] to-[#8b5cf6] gradient-text-animate">Fix Karachi.</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0"
          >
            Submit geo-tagged reports, track local repairs in real-time, audit public municipal performance, and work alongside the Metropolitan Corporation to fix Karachi's infrastructure.
          </motion.p>

          {/* Action buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
          >
            <Link 
              to={user ? (user.role === 'admin' || user.role === 'authority' ? '/admin' : '/') : '/register'}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-[#0e1417] bg-gradient-to-r from-[#00D4FF] to-[#00c896] hover:shadow-[0_0_25px_rgba(0,212,255,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Report an Issue / شکایت درج کریں <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/transparency" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-white border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Globe className="w-4.5 h-4.5 text-[#00D4FF]" /> Transparency Dashboard
            </Link>
          </motion.div>

          {/* Language support snippet */}
          <motion.p 
            variants={itemVariants}
            className="text-xs text-slate-500 font-medium tracking-wide"
          >
            🇺🇿 اردو اور انگریزی دونوں زبانوں میں دستیاب ہے۔
          </motion.p>
        </motion.div>

        {/* Right Column: Animated Mock Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex justify-center relative"
        >
          
          {/* Floating glowing aura behind widget */}
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#8b5cf6]/20 blur-xl opacity-80" />

          {/* The Widget */}
          <div className="w-full max-w-[420px] p-6 relative z-10 glowing-border" style={glassCardStyle}>
            
            {/* Header info */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-xs font-bold text-slate-300 font-mono">DHA Phase 6, Karachi</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ID: #FK-29804</span>
            </div>

            {/* Simulated Complaint image */}
            <div className="h-44 rounded-xl bg-slate-900/60 relative overflow-hidden mb-5 border border-white/5 flex items-center justify-center">
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400')`
              }} />
              <div className="absolute top-3 left-3 bg-[#0e1417]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-wide">
                Road Infrastructure
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-base font-black text-white mb-2">Severe Road Erosion & Potholes</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Main street damaged after drainage line burst. Causing traffic logjams and tire damage daily.
            </p>

            {/* Dynamic Status Bar */}
            <div className="bg-[#0e1417]/50 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Current Status:</span>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition-all duration-300"
                  style={{
                    color: mockStatus === 'reported' ? T.accent : mockStatus === 'inprogress' ? T.accentOrange : T.accentGreen,
                    background: mockStatus === 'reported' ? 'rgba(0,212,255,0.08)' : mockStatus === 'inprogress' ? 'rgba(255,107,53,0.08)' : 'rgba(0,200,150,0.08)',
                  }}
                >
                  {mockStatus === 'reported' && 'Reported'}
                  {mockStatus === 'inprogress' && 'Under Work'}
                  {mockStatus === 'resolved' && 'Resolved'}
                </span>
              </div>

              {/* Progress Line */}
              <div className="h-1 bg-white/5 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00c896] transition-all duration-1000"
                  style={{
                    width: mockStatus === 'reported' ? '33%' : mockStatus === 'inprogress' ? '66%' : '100%',
                  }}
                />
              </div>

              {/* Counter / Stats */}
              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-[#00D4FF] font-bold font-mono">▲ {mockUpvotes} Upvotes</span>
                <span className="text-slate-500 font-mono">15m Response SLA</span>
              </div>
            </div>

          </div>
        </motion.div>

      </section>

      {/* Stats Section */}
      <section id="stats" className="border-t border-b border-white/5 bg-[#1a2123]/20 py-16 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="text-4xl md:text-5xl font-black text-[#00d4ff] font-mono tracking-tighter">8,400+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reports Logged</div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <div className="text-4xl md:text-5xl font-black text-[#00c896] font-mono tracking-tighter">94%</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Resolution Rate</div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <div className="text-4xl md:text-5xl font-black text-amber-400 font-mono tracking-tighter">&lt; 24 hrs</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Avg SLA Dispatch</div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <div className="text-4xl md:text-5xl font-black text-purple-400 font-mono tracking-tighter">15,000+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verified Citizens</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10 space-y-16">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <span className="text-xs text-[#00d4ff] uppercase tracking-widest font-black">Robust Auditing</span>
          <h2 className="text-3xl md:text-4xl font-black text-white">Full-Stack Civic Accountability Features</h2>
          <p className="text-slate-400 text-base">
            No more manual spreadsheets or lost reports. Fix Karachi provides intelligent municipal tracking with automatic triggers and validation.
          </p>
        </motion.div>

        {/* The Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          
          {/* Card 1 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01, borderColor: "rgba(0, 212, 255, 0.25)" }}
            transition={{ duration: 0.2 }}
            className="p-6 flex flex-col justify-between" 
            style={glassCardStyle}
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/10 text-[#00d4ff] border border-cyan-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Geo-Tagged Live Reporting</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Log reports with precise GPS pinning. Automatic reverse geocoding identifies district boundaries, ward subdivisions, and streets.
              </p>
            </div>
            <div className="text-xs text-[#00d4ff] font-bold flex items-center gap-1 mt-6">
              View Map Interface <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01, borderColor: "rgba(0, 200, 150, 0.25)" }}
            transition={{ duration: 0.2 }}
            className="p-6 flex flex-col justify-between" 
            style={glassCardStyle}
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Proximity Duplicate Match</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Prevents report bloat. The system matches incoming complaints within a 200-meter radius using Haversine calculation and merges duplicates.
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-6">
              Haversine Proximity Check <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01, borderColor: "rgba(255, 107, 53, 0.25)" }}
            transition={{ duration: 0.2 }}
            className="p-6 flex flex-col justify-between" 
            style={glassCardStyle}
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">SLA Breach Warnings</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tickets open past 24 hours flash warning indicators. Reports unassigned after 48 hours alert authority panels with critical warnings.
              </p>
            </div>
            <div className="text-xs text-orange-400 font-bold flex items-center gap-1 mt-6">
              48-hour Dispatch Escalation <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01, borderColor: "rgba(255, 184, 0, 0.25)" }}
            transition={{ duration: 0.2 }}
            className="p-6 flex flex-col justify-between" 
            style={glassCardStyle}
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">District-Level Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Interactive admin dashboards map municipal performance. Check report frequency by district to audit resource allocation.
              </p>
            </div>
            <div className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-6">
              View Analytics Metrics <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 5 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01, borderColor: "rgba(139, 92, 246, 0.25)" }}
            transition={{ duration: 0.2 }}
            className="p-6 flex flex-col justify-between" 
            style={glassCardStyle}
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Peer Verification Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Citizens can verify reported incidents. High verification score forces higher KMC repair dispatch priority.
              </p>
            </div>
            <div className="text-xs text-purple-400 font-bold flex items-center gap-1 mt-6">
              Citizen Moderation <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 6 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01, borderColor: "rgba(59, 130, 246, 0.25)" }}
            transition={{ duration: 0.2 }}
            className="p-6 flex flex-col justify-between" 
            style={glassCardStyle}
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Data Export</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Export dashboard reports in CSV formats. Empowers researchers, news agencies, and residents to map public utility trends.
              </p>
            </div>
            <div className="text-xs text-blue-400 font-bold flex items-center gap-1 mt-6">
              CSV/PDF Support <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* Process Flow Section */}
      <section id="process" className="bg-[#1a2123]/10 border-t border-white/5 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto space-y-4"
          >
            <span className="text-xs text-[#00d4ff] uppercase tracking-widest font-black">Workflow</span>
            <h2 className="text-3xl font-black text-white">How Fix Karachi Operates</h2>
          </motion.div>

          {/* The Flow cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 relative"
          >
            
            {/* Step 1 */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="p-6 space-y-4 text-center md:text-left relative">
              <div className="w-10 h-10 rounded-full bg-[#00D4FF] text-[#0e1417] flex items-center justify-center font-extrabold text-sm mx-auto md:mx-0">1</div>
              <h3 className="text-base font-bold text-white">Spot & Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take a photo of a pothole, leak, or garbage dump. Pin the location on the map.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="p-6 space-y-4 text-center md:text-left relative">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-[#00D4FF] flex items-center justify-center font-extrabold text-sm mx-auto md:mx-0 border border-white/5">2</div>
              <h3 className="text-base font-bold text-white">AI Proximity Match</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                System checks for duplicate tickets. If found, upvote is added instead of duplicate thread.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="p-6 space-y-4 text-center md:text-left relative">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-extrabold text-sm mx-auto md:mx-0 border border-white/5">3</div>
              <h3 className="text-base font-bold text-white">Upvoting & Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Neighbors verify and upvote reports to build community consensus and signal priority.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="p-6 space-y-4 text-center md:text-left relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00C896] text-[#0e1417] flex items-center justify-center font-extrabold text-sm mx-auto md:mx-0">4</div>
              <h3 className="text-base font-bold text-white">KMC Dispatched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorities track unresolved issues on the Heatmap and dispatch work crews.
              </p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.65 }}
          className="rounded-3xl p-10 md:p-16 relative overflow-hidden border border-white/5 bg-gradient-to-br from-[#1a2123] to-[#0e1417] text-center space-y-8"
        >
          
          {/* Neon background light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#00D4FF]/5 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1]">
            Ready to improve your <br />
            neighborhood?
          </h2>
          
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Create an account in 60 seconds. Log civic alerts, track repairs, and verify city reports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-[#0e1417] bg-[#00D4FF] hover:bg-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
            >
              Sign Up for Free / رجسٹریشن کریں
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-white border border-white/10 hover:bg-white/5 transition-all"
            >
              Sign In to Account
            </Link>
          </div>

        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#080f12] text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#00D4FF]">
              <ShieldCheck className="w-4 h-4 text-[#0A1628]" />
            </div>
            <span className="font-extrabold text-white uppercase tracking-wider">
              Fix Karachi
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link to="/transparency" className="hover:text-white transition-colors">Transparency Feed</Link>
            <a href="#stats" className="hover:text-white transition-colors">Impact</a>
            <a href="#process" className="hover:text-white transition-colors">How it works</a>
          </div>

          <div>
            © 2026 Karachi Metropolitan Corporation. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
