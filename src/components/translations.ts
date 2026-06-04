export type Language = 'en' | 'ur';

export function isRTL(lang: Language): boolean {
  return lang === 'ur';
}

export function getStoredLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('fixkarachi_lang');
    if (stored === 'en' || stored === 'ur') return stored;
  }
  return 'en';
}

export function storeLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fixkarachi_lang', lang);
  }
}

export const translations = {
  en: {
    // App
    appName: "Fix Karachi",
    appNameUrdu: "فکس کراچی",
    tagline: "Your city, your voice",
    taglineUrdu: "شہر آپ کا، آواز آپ کی",

    // Navigation
    home: "Home",
    report: "Report",
    map: "Map",
    analytics: "Analytics",
    profile: "Profile",

    // Onboarding
    getStarted: "Get Started",
    skip: "Skip",
    slide1Title: "Report issues instantly",
    slide1Subtitle: "Snap a photo, tag the issue, and submit in seconds",
    slide2Title: "Keep Karachi safe",
    slide2Subtitle: "Help identify safety hazards and infrastructure problems",
    slide3Title: "Track city progress",
    slide3Subtitle: "See real-time analytics and resolution updates",

    // Home
    latestReports: "Latest Reports",
    nearbyIssues: "Nearby Issues",
    activeReports: "Active Reports",
    reportsCount: "Reports",
    resolvedCount: "Resolved",
    todayCount: "Today",
    search: "Search issues...",

    // Report Screen
    reportTitle: "Report an Issue",
    reportCategory: "Select Category",
    reportDetails: "Details",
    reportLocation: "Location",
    reportReview: "Review",
    describeIssue: "Describe the issue...",
    addDescription: "Add a description",
    uploadPhoto: "Upload Photo",
    takePhoto: "Take a photo or upload",
    useMyLocation: "Use my current location",
    submitReport: "Submit Report",
    stepDetails: "Details",
    stepLocation: "Location",
    stepReview: "Review",
    next: "Next",
    back: "Back",
    reportSuccess: "Report submitted successfully!",

    // Categories
    pothole: "Pothole",
    garbage: "Garbage",
    streetlight: "Streetlight",
    water: "Water",
    sewerage: "Sewerage",
    safety: "Safety",

    // Status
    statusReported: "Reported",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",

    // Map
    statusEmergency: "Emergency",
    statusFlagged: "Flagged",
    highPriority: "High Priority",
    allReports: "All",
    issuesNearby: "issues nearby",
    filterAll: "All",

    // Analytics
    cityDashboard: "City Dashboard",
    totalReports: "Total Reports",
    resolved: "Resolved",
    pending: "Pending",
    avgResolution: "Avg Resolution",
    reportsByCategory: "Reports by Category",
    weeklyTrend: "Weekly Trend",
    topProblemAreas: "Top Problem Areas",

    // Profile
    karachiCitizen: "Karachi Citizen",
    reportsSubmitted: "Submitted",
    verified: "Verified",
    myReports: "My Reports",
    settings: "Settings",
    language: "Language",
    logout: "Logout",
    onlineMode: "Online Mode",
    offlineMode: "Offline Mode",

    // General
    cancel: "Cancel",
    submit: "Submit",
    upvote: "Upvote",
    comment: "Comment",
    comments: "Comments",
    addComment: "Add comment...",
    postComment: "Post",
    viewDetails: "View Details",
    reportAgain: "Report Again",
    loading: "Loading...",
    noReports: "No reports found",

    // Time
    minutesAgo: "min ago",
    hoursAgo: "hr ago",
    daysAgo: "days ago",
    justNow: "Just now",

    // Notifications
    reportSubmitted: "Report submitted! ID:",
    savedOffline: "Saved offline — will sync when online",
    syncComplete: "Sync complete — report uploaded",
    confidence: "confidence",

    // Misc
    kmAway: "km away",
    slaCountdown: "SLA: 5 days remaining",
    rateResolution: "Rate this resolution",
    downloadCertificate: "Download Certificate",
    estimatedResponse: "Estimated response: 24-48 hours",
    departmentAssignment: "Department Assignment",
  },

  ur: {
    // App
    appName: "فکس کراچی",
    appNameUrdu: "فکس کراچی",
    tagline: "شہر آپ کا، آواز آپ کی",
    taglineUrdu: "شہر آپ کا، آواز آپ کی",

    // Navigation
    home: "ہوم",
    report: "رپورٹ",
    map: "نقشہ",
    analytics: "تجزیہ",
    profile: "پروفائل",

    // Onboarding
    getStarted: "شروع کریں",
    skip: "چھوڑیں",
    slide1Title: "فوری رپورٹ کریں",
    slide1Subtitle: "تصویر لیں، مسئلہ بتائیں، سیکنڈوں میں جمع کریں",
    slide2Title: "کراچی کو محفوظ بنائیں",
    slide2Subtitle: "حفاظتی خطرات اور بنیادی ڈھانچے کے مسائل کی نشاندہی کریں",
    slide3Title: "شہر کی ترقی دیکھیں",
    slide3Subtitle: "حقیقی وقت کے تجزیے اور حل کی اپ ڈیٹس دیکھیں",

    // Home
    latestReports: "تازہ رپورٹس",
    nearbyIssues: "قریبی مسائل",
    activeReports: "فعال رپورٹس",
    reportsCount: "رپورٹس",
    resolvedCount: "حل شدہ",
    todayCount: "آج",
    search: "مسائل تلاش کریں...",

    // Report Screen
    reportTitle: "مسئلہ رپورٹ کریں",
    reportCategory: "قسم منتخب کریں",
    reportDetails: "تفصیلات",
    reportLocation: "مقام",
    reportReview: "جائزہ",
    describeIssue: "مسئلہ بیان کریں...",
    addDescription: "تفصیل شامل کریں",
    uploadPhoto: "تصویر اپلوڈ کریں",
    takePhoto: "تصویر لیں یا اپلوڈ کریں",
    useMyLocation: "میرا موجودہ مقام استعمال کریں",
    submitReport: "رپورٹ جمع کریں",
    stepDetails: "تفصیلات",
    stepLocation: "مقام",
    stepReview: "جائزہ",
    next: "اگلا",
    back: "پچھلا",
    reportSuccess: "رپورٹ کامیابی سے جمع ہو گئی!",

    // Categories
    pothole: "گڑھا",
    garbage: "کچرا",
    streetlight: "بجلی",
    water: "پانی",
    sewerage: "نالہ",
    safety: "سیکیورٹی",

    // Status
    statusReported: "رپورٹ ہوا",
    statusInProgress: "جاری ہے",
    statusResolved: "حل ہوا",

    // Map
    statusEmergency: "ہنگامی",
    statusFlagged: "نشان زد",
    highPriority: "اعلیٰ ترجیح",
    allReports: "تمام",
    issuesNearby: "قریبی مسائل",
    filterAll: "تمام",

    // Analytics
    cityDashboard: "شہری ڈیش بورڈ",
    totalReports: "کل رپورٹس",
    resolved: "حل شدہ",
    pending: "زیر التوا",
    avgResolution: "اوسط وقت",
    reportsByCategory: "قسم کے لحاظ سے",
    weeklyTrend: "ہفتہ وار رجحان",
    topProblemAreas: "سب سے زیادہ مسائل والے علاقے",

    // Profile
    karachiCitizen: "کراچی شہری",
    reportsSubmitted: "جمع شدہ",
    verified: "تصدیق شدہ",
    myReports: "میری رپورٹس",
    settings: "ترتیبات",
    language: "زبان",
    logout: "لاگ آؤٹ",
    onlineMode: "آن لائن موڈ",
    offlineMode: "آف لائن موڈ",

    // General
    cancel: "منسوخ",
    submit: "جمع کریں",
    upvote: "ووٹ",
    comment: "تبصرہ",
    comments: "تبصرے",
    addComment: "تبصرہ لکھیں...",
    postComment: "بھیجیں",
    viewDetails: "تفصیلات دیکھیں",
    reportAgain: "دوبارہ رپورٹ",
    loading: "لوڈ ہو رہا ہے...",
    noReports: "کوئی رپورٹ نہیں ملی",

    // Time
    minutesAgo: "منٹ پہلے",
    hoursAgo: "گھنٹے پہلے",
    daysAgo: "دن پہلے",
    justNow: "ابھی",

    // Notifications
    reportSubmitted: "!رپورٹ جمع ہو گئی! نمبر:",
    savedOffline: "آف لائن محفوظ — آن لائن ہونے پر بھیجی جائے گی",
    syncComplete: "مکمل — رپورٹ اپلوڈ ہو گئی",
    confidence: "اعتماد",

    // Misc
    kmAway: "کلومیٹر دور",
    slaCountdown: "ایس ایل اے: 5 دن باقی",
    rateResolution: "اس حل کی درجہ بندی کریں",
    downloadCertificate: "سرٹیفکیٹ ڈاؤن لوڈ کریں",
    estimatedResponse: "متوقع جواب: 24-48 گھنٹے",
    departmentAssignment: "محکمے کی تفویض",
  }
};