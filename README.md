# 🚀 LeadFusion - Lead Management Platform

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC)
![License](https://img.shields.io/badge/license-ISC-green)

**A modern, full-stack lead management platform built with Next.js 16, React 19, and TypeScript**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [API Documentation](#-api-documentation)

</div>

---

##  Features

###  Lead Management
- **Lead Tracking** - Comprehensive lead lifecycle management
- **Campaign Integration** - Associate leads with marketing campaigns
- **CSV Import** - Bulk lead import functionality
- **Lead Status Workflow** - Track payment status, return status, and lead progression
- **Real-time Updates** - Socket.io integration for live lead updates

###  Dual Dashboard System

#### User Dashboard
- **Personal Dashboard** - View your leads, campaigns, and billing info
- **Campaign Management** - Create and manage your marketing campaigns
- **Billing Control** - Track spending and manage payments
- **Settings** - Personal profile and preferences
- **FAQ & Support** - In-app help and feedback system
- **Live Chat** - Real-time communication support

#### Admin Dashboard
- **User Management** - Full user administration with verification controls
- **Lead Analytics** - Comprehensive lead tracking and reporting
- **Campaign Oversight** - Monitor and manage all campaigns
- **Location Management** - Geographic targeting and coverage
- **Activity Logs** - Full audit trail of system activities
- **System Settings** - Platform-wide configuration

###  Enterprise-Grade Authentication
- **JWT-based Authentication** - Secure token management
- **Remember Me** - Extended 30-day sessions
- **Role-based Access Control** - Admin/User permission levels
- **Email Verification** - Secure account activation
- **Password Recovery** - Forgot password flow with secure reset
- **Session Monitoring** - Cross-tab session synchronization
- **Redis Caching** - Optimized auth token caching

###  Billing & Payments
- **Real-time Balance Tracking** - Current account balance display
- **Payment Processing** - Secure payment integration
- **Transaction History** - Full payment audit trail
- **Pay Now Feature** - Single-click lead payment

###  Location Features
- **Google Maps Integration** - Interactive map-based location picking
- **Geographic Targeting** - State and zip code coverage
- **Leaflet Maps** - Alternative mapping solution

###  Real-time Communication
- **Socket.io Integration** - Live updates and notifications
- **In-app Chat** - User-to-admin communication
- **Notification System** - Real-time alerts

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React Framework |
| React | 19.x | UI Library |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| Redux Toolkit | 2.x | State Management |
| MUI (Material-UI) | 7.x | UI Components |
| Formik + Yup | Latest | Form Management |
| Recharts | 3.x | Data Visualization |
| Socket.io Client | 4.x | Real-time Communication |


---

## Getting Started

### Prerequisites

- **Node.js** 18+ (see `.nvmrc`)
- **npm** or **pnpm**
- **MongoDB** instance
- **Redis** (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/leadfusionhq/leadfusion.git
   cd leadfusion
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following in `.env`:
   ```env

   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -f Dockerfile.dev -t leadfusion-dev .
docker run -p 3000:3000 leadfusion-dev
```

---

## 📁 Project Structure

```
leadfusion/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   └── admin/          # Admin-only endpoints
│   │   ├── admin/              # Admin pages
│   │   ├── dashboard/          # User dashboard pages
│   │   ├── login/              # Auth pages
│   │   ├── register/
│   │   └── ...
│   │
│   ├── components/             # React Components
│   │   ├── admin-dashboard/    # Admin UI components
│   │   │   ├── campaigns/
│   │   │   ├── leads/
│   │   │   ├── user-management/
│   │   │   └── ...
│   │   ├── user-dashboard/     # User UI components
│   │   │   ├── campaigns/
│   │   │   ├── leads/
│   │   │   ├── billing-control/
│   │   │   └── ...
│   │   ├── auth/               # Auth components
│   │   ├── common/             # Shared components
│   │   ├── Layout/             # Layout components
│   │   └── ...
│   │
│   ├── redux/                  # Redux state management
│   │   ├── auth/               # Auth slice & actions
│   │   └── store.ts
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── context/                # React Context providers
│   ├── services/               # Business logic services
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript definitions
│   ├── middleware/             # API middleware
│   ├── models/                 # MongoDB models
│   └── mails/                  # Email templates
│
├── public/                     # Static assets
├── docker-compose.yml          # Docker configuration
├── Dockerfile                  # Production Dockerfile
├── Dockerfile.dev              # Development Dockerfile
└── package.json
```

---


## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🔧 Configuration

### TypeScript Configuration

The project uses strict TypeScript configuration. See `tsconfig.json` for details.

### ESLint Configuration

ESLint is configured via `eslint.config.mjs` with Next.js recommended rules.

### Installing Type Definitions

When adding new dependencies, install types with:
```bash
npm i --save-dev @types/package-name
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##   License

This project is licensed under the ISC License.

---

##   Support

For support, please contact the development team or open an issue on GitHub.

- **GitHub Issues**: [Report a bug](https://github.com/leadfusionhq/leadfusion/issues)

---

<div align="center">

---
Built with ❤️ by the LeadFusion Team | https://github.com/leadfusionhq/leadfusion
---

</div>