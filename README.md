# FloraAI Cloud Irrigation Dashboard

A modern, high-performance IoT plant irrigation dashboard rebuilt with **Next.js 15 (App Router)** and **React 19**, seamlessly connected to **Firebase Realtime Database** for live ESP32 telemetry and actuator control.

---

## ✨ Features & Upgrades

- **Live Firebase RTDB Integration**: Listens in real time to `/telemetry` from your ESP32 hardware and writes control states to `/commands`.
- **Radial SVG Moisture Gauge**: Dynamic liquid progress arc with condition badges (*Critically Dry*, *Needs Water*, *Optimal*, *Saturated*).
- **Interactive Actuator Controls**:
  - **Turn Pump ON / OFF** with glowing visual states and live actuation feedback.
  - **Toggle Mode**: Seamlessly switch between **Manual Mode** and **Auto AI Mode**.
  - **Quick Spray (10s)**: Automated one-click water pulse with live countdown timer.
- **Real-Time Telemetry Trend**: Animated SVG area chart tracking moisture progression over time.
- **Tactile UI Sound Engine**: Lightweight zero-dependency Web Audio synthesizer providing realistic clicks, water flow, and power sounds (toggleable).
- **Built-in Demo Simulation Mode**: Test and preview the entire dashboard with virtual telemetry even when your ESP32 is offline.
- **Firebase Settings Modal**: Easily update your Firebase Realtime Database URL directly from the interface.
- **Original Code Preserved**: The original single-file `index.html` is safely backed up as [index.html.original](file:///c:/Users/NISHANT/Documents/PLANT%20IRRIGATION%20SYSTEM/index.html.original).

---

## 📁 Project Architecture

```
PLANT IRRIGATION SYSTEM/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Next.js App Router root layout & metadata
│   │   ├── page.tsx           # Main FloraAI dashboard page
│   │   └── globals.css        # Premium Vanilla CSS design system
│   ├── components/
│   │   ├── Header.tsx         # Top bar with status pill, demo mode, and sound toggle
│   │   ├── MoistureGauge.tsx  # Dynamic SVG circular moisture gauge
│   │   ├── PumpController.tsx # Pump ON/OFF, Mode switch, and 10s burst controls
│   │   ├── EnvironmentCards.tsx # Sensor telemetry cards (Temp, Humidity, Valve)
│   │   ├── TelemetryChart.tsx # SVG real-time trend line/area chart
│   │   ├── ActivityLogView.tsx# Actuation history and event feed
│   │   └── SettingsModal.tsx  # Firebase configuration dialog
│   ├── lib/
│   │   ├── firebase.ts        # Firebase Realtime Database client singleton
│   │   └── sounds.ts          # Web Audio API sound synthesizer
│   └── types/
│       └── index.ts           # TypeScript interfaces for telemetry and commands
├── package.json               # Next.js, React, Firebase & Lucide dependencies
├── tsconfig.json              # TypeScript configuration
├── next.config.mjs            # Next.js configuration
├── index.html.original        # Backup of the original HTML file
└── README.md
```

---

## 🚀 Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Build for Production
```bash
npm run build
npm start
```

---

## ⚡ Firebase Contract

Your ESP32 and this Next.js app share the following Realtime Database endpoints:

- **Telemetry Read**: `/telemetry`
  ```json
  {
    "moisture": 52,
    "temperature": 24.5,
    "humidity": 60
  }
  ```

- **Commands Write**: `/commands`
  ```json
  {
    "mode": "manual" | "auto",
    "pump": "on" | "off"
  }
  ```
