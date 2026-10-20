# Rootwise — Smart Soil Irrigation System 🌱

An intelligent soil-irrigation platform that monitors soil moisture and automates watering using an ESP32 microcontroller and a soil-moisture sensor.

Rootwise combines embedded hardware with a modern web interface to help users monitor soil conditions, manage irrigation, and make plant care more efficient.

## ✨ Features

- **Soil Moisture Monitoring** — Read and display soil-moisture sensor values.
- **Moisture Visualization** — Present calibrated moisture readings as percentage bars and visual indicators.
- **Automatic Irrigation** — Activate irrigation according to configured soil-moisture thresholds supported by the ESP32 firmware.
- **Manual Pump Control** — Control the irrigation pump through the website where supported by the existing hardware communication implementation.
- **Device Connectivity** — Communicate with the ESP32 through the project's existing network architecture.
- **Responsive Interface** — Access the application from desktop, tablet, and mobile devices.
- **Modern Web Architecture** — Built using Next.js, React, and TypeScript.

> Actual hardware functionality depends on the ESP32 firmware, communication configuration, and network connectivity. Features that require additional backend integration must be configured before use.

## 🛠️ Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- CSS / Tailwind CSS, depending on the implemented configuration
- GSAP for animations, where configured
- Lucide icons, where configured

### Hardware
- ESP32 microcontroller
- Soil-moisture sensor
- Relay module or suitable pump driver
- Water pump
- Power supply appropriate for the hardware

### Communication
The website uses the communication mechanism implemented in the existing project and ESP32 firmware. This may involve HTTP requests, a cloud service, or another supported networking mechanism.

Refer to the source code and firmware for the actual endpoints, protocols, and configuration requirements.

## 📁 Project Structure

```text
PLANT IRRIGATION SYSTEM/
├── src/
│   ├── app/              # Next.js application routes and layouts
│   ├── components/       # Reusable React components
│   ├── lib/              # Utilities and application services
│   └── types/             # TypeScript types
├── index.html             # Existing HTML implementation, if retained
├── index.html.original    # Original website backup, if retained
├── next.config.mjs        # Next.js configuration
├── next-env.d.ts          # Next.js TypeScript declarations
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lockfile
├── tsconfig.json          # TypeScript configuration
├── .gitignore             # Git exclusions
└── README.md              # Project documentation
```

The actual application entry point is typically `src/app/page.tsx` in a Next.js App Router project. The standalone HTML files are not automatically served as the Next.js homepage.

## 🚀 Getting Started

### Prerequisites

Install the following:
- Node.js LTS
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/nishantsaha69420-debug/Plant-Irrigation-System.git
cd Plant-Irrigation-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the URL displayed in the terminal, usually:

http://localhost:3000

### 4. Create a production build

```bash
npm run build
```

To serve the production build locally, run:

```bash
npm run start
```

Run `npm run build` before deployment to identify build-time errors.

## 🌿 Hardware Setup

The irrigation hardware uses an ESP32 and a soil-moisture sensor to monitor soil conditions and control watering.

A typical system includes:

1. An ESP32 microcontroller.
2. A compatible soil-moisture sensor.
3. A relay module or suitable pump driver.
4. A water pump.
5. An appropriate power supply and wiring.

The ESP32 firmware is responsible for reading the sensor and controlling the pump according to its implemented logic.

### Sensor Calibration

Raw sensor output is not necessarily a moisture percentage. If the sensor reports an analog-to-digital converter (ADC) value, convert it using calibration values appropriate for the actual sensor and soil conditions.

Do not interpret uncalibrated raw readings as accurate percentages.

### Pump Safety

Use appropriate electrical isolation and a pump driver rated for the pump's voltage and current. Do not power a pump directly from an ESP32 GPIO pin.

Implement appropriate pump timeouts and fail-safe behavior in the firmware so that watering does not continue indefinitely if the website or network becomes unavailable.

## 🌐 ESP32 and Website Communication

The website and ESP32 must use a compatible communication mechanism.

Before changing the communication layer, inspect the existing HTML and firmware to identify:
- Device addresses and API endpoints.
- Supported request methods and payload formats.
- Sensor-reading operations.
- Pump-control commands.
- Wi-Fi provisioning and connection requirements.
- Any required cloud service, tunnel, or intermediary server.

Preserve the existing working communication mechanism when extending or migrating the frontend.

A website deployed to the public internet cannot automatically access an ESP32's private local IP address from every network. Remote operation requires an appropriate network architecture, such as a reachable public backend, secure cloud relay, or another supported mechanism.

Never expose private device credentials, service-role keys, or unrestricted pump-control endpoints in public frontend code.

## 🔐 Authentication and Configuration

If authentication or cloud services are configured, supply the required environment variables through the deployment platform's environment-variable settings.

For local development, use a `.env.local` file where appropriate.

Never commit secrets, passwords, private tokens, or production credentials to Git.

Environment variables prefixed with `NEXT_PUBLIC_` are exposed to client-side code and must not contain secrets.

Authentication, device ownership, and authorization should be implemented before allowing multiple users to control private devices.

## ☁️ Deployment on Vercel

1. Push the project to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com/).
3. Import the GitHub repository.
4. Ensure the project root points to the directory containing `package.json`.
5. Configure the required environment variables, if any.
6. Deploy the application.

Vercel detects Next.js projects automatically in typical configurations.

After deployment, verify that:
- The production build succeeds.
- The landing page and dashboard load correctly.
- Authentication works if configured.
- Sensor readings are retrieved from the intended source.
- Pump commands reach the actual hardware.
- Remote connectivity works through the supported network architecture.

A successful website deployment does not, by itself, guarantee ESP32 connectivity.

## 🧪 Testing and Troubleshooting

If the application does not start:

```bash
npm install
npm run dev
```

If the production build fails:

```bash
npm run build
```

Check the terminal output for missing dependencies, TypeScript errors, invalid imports, or configuration problems.

If the dashboard cannot read sensor values, verify the device connection, endpoint configuration, network reachability, and browser console errors.

If pump controls fail, inspect the request response and ESP32 firmware logs. A successful button click does not necessarily mean the physical pump has activated.

## 🔮 Future Improvements

Potential extensions include:
- Multiple irrigation devices and plant zones.
- Historical soil-moisture charts.
- Irrigation event logs.
- Configurable moisture thresholds.
- Device health monitoring.
- User accounts and device ownership.
- Secure remote pump control.
- Notifications for low moisture or device disconnection.
- Water-usage tracking, where the hardware supports measurement.

These are potential enhancements, not claims that every feature is currently implemented.

## 📄 License

No license has been specified yet. Add an appropriate license before permitting others to reuse, modify, or redistribute this project.

---

**Rootwise — Smarter watering, healthier roots.** 🌱
