# ORE Platform Architecture & Component Map

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ORE PLATFORM                          │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
            ┌───▼───┐    ┌────▼────┐   ┌───▼────┐
            │ LOGIN │ ── │DASHBOARD│── │PROFILE │
            └───────┘    └────┬────┘   └────────┘
                              │
                    ┌─────────▼─────────┐
                    │  ORE-DASHBOARD    │
                    │  (Grid Layout)    │
                    └────┬──────┬──┬────┘
                         │      │  └──────────────────┐
                         │      │                     │
                    ┌────▼────┐ │         ┌───────────▼───┐
                    │ LIVE    │ │         │  COMING SOON  │
                    │ APPS    │ │         │  APPS         │
                    └─────────┘ │         └───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │ /ore/apps/:appId     │
                    │ (OREMicroApp Wrapper)│
                    └───────────┬───────────┘
                                │
                    ┌───────────┴──────────┐
                    │                      │
          ┌─────────▼────────┐   ┌────────▼─────────┐
          │ ORELeftSidebar   │   │  App Content     │
          │ (Ads + Info)     │   │  (Original App)  │
          └──────────────────┘   └──────────────────┘
```

## 📦 Component Hierarchy

```
┌──────────────────────────────────────┐
│         App (Main Router)            │
└──────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────────┐      ┌────▼──────────┐
│  Existing  │      │   ORE Routes  │
│  Routes    │      └────┬──────────┘
└────────────┘           │
                ┌────────┴─────────┐
                │                  │
         ┌──────▼──────┐    ┌──────▼──────────┐
         │ Dashboard   │    │  Micro-App     │
         │ (Grid View) │    │  Pages         │
         └──────┬──────┘    └──────┬──────────┘
                │                  │
         ┌──────▼──────┐    ┌──────▼──────────┐
         │  ORECard x  │    │ OREMicroApp    │
         │  (App List) │    │  Wrapper       │
         └─────────────┘    └──────┬──────────┘
                                   │
                      ┌────────────┴──────────┐
                      │                       │
                 ┌────▼─────┐    ┌──────────▼─┐
                 │ORELeftBar │    │ App Content│
                 │(w/ Ads)   │    └────────────┘
                 └───────────┘
```

## 📂 File Structure

```
src/
├── components/
│   ├── OReLogo.jsx .................. Logo component
│   ├── OREButton.jsx ............... Button component
│   ├── ORECard.jsx ................. Card component
│   ├── ORELeftSidebar.jsx ........... Sidebar with ads
│   ├── OREHomeSidebar.jsx ........... Nav sidebar
│   ├── OREQuickStart.jsx ............ Onboarding
│   ├── MonetizationCard.jsx ......... (existing, reused)
│   ├── MicroAppRightLayout.jsx ...... (existing, reused)
│   └── [other components]
│
├── pages/
│   ├── OREDashboard.jsx ............ New hub page
│   ├── OREMicroApp.jsx ............ New wrapper
│   ├── Login.jsx ................... (existing)
│   ├── CustomerDashboard.jsx ....... (existing)
│   └── [other pages]
│
├── config/
│   ├── oreTheme.js ................ Theme utilities
│   ├── routes.js .................. Route constants
│   └── api.js ..................... API config
│
├── data/
│   └── microApps.js ............... App definitions
│
├── context/
│   └── AuthContext.jsx ............ Auth context
│
├── App.jsx ........................ Main app + routes
├── App.css ........................ Global styles
└── main.jsx ....................... Entry point

public/
├── manifest.json .................. PWA manifest
└── sw.js .......................... Service worker
```

## 🔄 Data Flow

### 1. Dashboard Loading
```
OREDashboard 
    └─ imports: microApps from '/data/microApps.js'
       └─ filters by status (Live/Build)
          └─ renders ORECard components
             └─ onClick: navigate to /ore/apps/:appId
```

### 2. App Opening
```
/ore/apps/:appId
    └─ OREMicroApp receives appId from params
       └─ finds app in microApps data
          └─ renders ORELeftSidebar + app content
             └─ ORELeftSidebar: loads googleAds
                └─ rotates ad every 6 seconds
                   └─ shows different ad images
```

### 3. Component Prop Chains
```
OREDashboard
    └─ AppCard
       └─ receives: {app, onSelect}
          └─ onClick: handleAppClick(appId)

OREMicroApp
    └─ ORELeftSidebar
       └─ receives: {app, isPro, backTo}
          └─ onClick Back: navigate back

ORELeftSidebar
    └─ MonetizationCard
       └─ receives: {app}
```

## 🎨 Component Variants

### OREButton Variants
```
┌─ Primary (Red) ─────→ bg-red-500 hover:bg-red-600
├─ Secondary (Gray) ──→ bg-gray-100 hover:bg-gray-200
├─ Outline (Bordered) → border-red-500 text-red-600
└─ Ghost (Text) ──────→ text-red-600 hover:bg-red-50
```

### ORECard Variants
```
┌─ Elevated ──→ Shadow + Border + Hover effect
├─ Outlined ──→ Border only + Hover effect
└─ Filled ────→ Filled background + Hover effect
```

### OReLogo Variants
```
┌─ Full ──→ Logo + Text "ORE Careers"
└─ Icon ──→ Logo only (no text)
  
Sizes: xs, sm, md, lg, xl
```

## 🌐 Route Map

```
/
├── /login ............................ Login page
├── /signup ........................... Signup page
├── /admin ............................ Admin dashboard
│   ├── /admin/dashboard .............. Ecosystem hub
│   ├── /admin/apps/... ............... Admin app pages
│   └── /admin/apps/:appId ........... Generic app viewer
├── /customer ......................... Customer dashboard
├── /customer/apps/:appId ............ Old app view (ATRact)
├── /ore-dashboard ................... New app hub (ORE)
└── /ore/apps/:appId ................. New app view (ORE)
```

## 🎬 User Journey Map

### New User Journey
```
START
  ↓
/login
  ↓
Enter Credentials
  ↓
Redirect to /ore-dashboard (redirected from /)
  ↓
View Quick Start Tour (Optional)
  ↓
Browse all 10 micro-apps
  ↓
Click on app
  ↓
/ore/apps/:appId
  ↓
View app with sidebar
  ↓
See Google Ads
  ↓
Use app features
  ↓
Click Back
  ↓
Return to /ore-dashboard
  ↓
Find another app
```

## 🎨 Color System

### Primary Actions (Use Everywhere)
```
Color: #ef4444 (red-500)
Hover: #dc2626 (red-600)
Active: #b91c1c (red-700)
Background: #fef2f2 (red-50)
```

### Text
```
Dark Text: #1f2937 (gray-800/900)
Medium Text: #6b7280 (gray-500)
Light Text: #9ca3af (gray-400)
```

### Status Badges
```
Live: bg-emerald-100 text-emerald-700
Build: bg-blue-100 text-blue-700
Error: bg-red-100 text-red-700
```

## 📊 State Management

### Global State
```
AuthContext
  └─ user: {id, email, role, name}
  └─ logout(): Promise
  
Stored in: localStorage (STORAGE_KEY)
```

### Component State
```
OREDashboard
  └─ searchTerm: string
  └─ setSearchTerm: function

ORELeftSidebar
  └─ currentAd: number
  └─ setCurrentAd: function

OREQuickStart
  └─ step: number
  └─ setStep: function
```

## 🔐 Protected Routes

```
/ore-dashboard ────► ProtectedRoute ────► allowedRole: "customer"
/ore/apps/:appId ──► ProtectedRoute ────► allowedRole: "customer"
```

## 📱 Responsive Breakpoints

```
xs: 375px  ─── Mobile phones
sm: 640px  ─── Small tablets
md: 768px  ─── Tablets
lg: 1024px ─── Laptops
xl: 1280px ─── Desktops
```

## 🔗 External Dependencies

### Existing
```
react-router-dom ........... Routing
tailwindcss ................ Styling
axios ...................... API calls
```

### Assets
```
Google Ads Images (Unsplash URLs)
ORE Logo (SVG - generated in component)
```

## 📈 Performance Metrics

- **Load Time**: Fast (all components are lightweight)
- **Bundle Size**: Minimal increase (6 new components, ~15KB)
- **Render Performance**: Optimized with React hooks
- **Ad Performance**: Unchanged from original

## 🔍 Component Dependencies

```
OREDashboard
  ├─ OReLogo
  ├─ ORECard (x10)
  │   └─ Badge rendering
  └─ useNavigate hook

OREMicroApp
  ├─ ORELeftSidebar
  │   ├─ OReLogo
  │   ├─ MonetizationCard (existing)
  │   └─ useContext(AuthContext)
  ├─ MicroAppRightLayout (existing)
  └─ useParams hook

ORELeftSidebar
  ├─ OReLogo
  ├─ MonetizationCard
  ├─ useNavigate hook
  ├─ useContext(AuthContext)
  └─ useState hook
```

---

## Summary

The ORE platform is built on:
- **6 New Components** for consistent UI
- **2 New Pages** for the hub experience
- **1 New Route Pattern** (/ore/*)
- **Existing Infrastructure** (auth, api, database)
- **Reused Components** (no duplication)
- **Simple Data Model** (10 apps array)

All pieces fit together seamlessly! 🎯

