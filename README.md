# 🏛️ Fix Karachi — فکس کراچی
### "شہر آپ کا، آواز آپ کی" (Your city, your voice)

[![ZabeFest 2026](https://img.shields.io/badge/Hackathon-ZabeFest%202026-00D4FF)](https://szabist.edu.pk/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8)](https://tailwindcss.com/)

**Fix Karachi (فکس کراچی)** is a premium, dark-themed civic-tech mobile prototype developed for **ZabeFest Hackathon 2026**. Designed with the visual sophistication of modern executive dashboards, the application empowers Karachi citizens to report, track, and advocate for public infrastructure improvements.

---

## 📸 Core Features & Design System

### 🎨 Apple-Grade Civic Dashboard Design
- **Harmonious Dark Theme**: Built on `#0A1628` deep navy backgrounds, `#0F2040` elevated cards, and `#00D4FF` electric cyan accents. Completely removed default styling to feel like a high-tier administration tool.
- **Micro-Animations & Transitions**: Leverages `motion` (Framer Motion) for fluid tab transitions, card mounts, and layout animations.
- **JetBrains Mono Integration**: All numeric displays and stats utilize JetBrains Mono for a clean, telemetry-style presentation.

### 🌐 Dual Language & True RTL (Urdu)
- **Local Language Support**: Seamless English and Urdu (`ur`) toggle.
- **Bi-directional Layout**: Full RTL layout direction support when Urdu is selected, transforming margins, positions, and navigation vectors cleanly.
- **Urdu Typography**: Uses `Noto Nastaliq Urdu` font stack to render Urdu text with authentic, premium rendering.

### 🗺️ Live Dark Map
- **CartoDB Dark Matter Tiles**: Integrated with a custom Leaflet wrapper utilizing CartoDB dark tiles to match the system dark palette.
- **Karachi Centered (24.8607° N, 67.0011° E)**: Configured with 20 real-world seed reports distributed across Saddar, Clifton, Gulshan-e-Iqbal, PECHS, Korangi, Malir, Nazimabad, Lyari, and other major districts.
- **Category Colors**: Custom markers dynamically styled according to severity and category.

### 📊 Real-time Analytics & telemetry
- **Telemetry Counters**: Animated count-ups when viewing the dashboard metrics.
- **Dark Charts**: Beautiful Recharts bar and line graphs representing issue distribution and weekly reporting trends.
- **Top Problem Districts**: Dynamic progress indicators demonstrating issue counts by Karachi municipality areas.

### 🗂️ 3-Step Wizard & Confetti
- **Detail Collection**: Form fields for category selection (Pothole, Garbage, Water, Sewerage, Safety, Streetlight), description, and photo attachments.
- **Location Selector**: Pinpoint locations with coordinate detection.
- **Submission Confetti**: Success animations integrated with `canvas-confetti` customized with brand-harmonized color hexes.

---

## 🛠️ Technology Stack

- **React 18.3.1**
- **Vite 6.3.5**
- **TypeScript 5.9.2**
- **Tailwind CSS v4** (CSS-in-JS configurations compiled directly via inline `@theme`)
- **Framer Motion (`motion/react`)**
- **Leaflet Map API & CartoDB**
- **Recharts**
- **Lucide Icons**
- **Canvas Confetti**

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Saad140606/stunning-tribble.git
   cd stunning-tribble
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the development server:
```bash
npm run dev
```

### Production Build
To bundle the project for deployment:
```bash
npm run build
```

---

## 🏛️ Acknowledgments
- **ZabeFest 2026** — SZABIST University's premier hackathon.
- **KMC (Karachi Municipal Corporation)** — For providing context on urban development categories and priorities.
- **CartoDB & OpenStreetMap** — For open-source dark map layers.

*Building a cleaner, safer Karachi — one report at a time.* 🇵🇰
