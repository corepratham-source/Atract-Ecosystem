# CORE Careers: Platform Redesign & Integration Guide

## 🎯 Overview

The CORE Careers platform has been redesigned with new branding, colors, and a modern micro-app integration system. All micro-apps are now accessible from a centralized hub while preserving the original app implementations and Google Ads functionality.

---

## 🎨 CORE Brand Colors

### Primary Red (Main Action Color)
- **Primary**: `#ef4444` (bg-red-500)
- **Hover**: `#dc2626` (bg-red-600)
- **Active**: `#b91c1c` (bg-red-700)

### CORE Gray (Accents)
- **Light**: `#b8b8b8`
- **Main**: `#8b8b8b`
- **Dark**: `#5a5a5a`

### Implementation
```jsx
// Using Tailwind
<button className="bg-red-500 text-white hover:bg-red-600">
  Action Button
</button>

// Using theme utilities
import { CORE_COLORS } from '../config/coreTheme';
const primaryRed = CORE_COLORS.red[500];
```

---

## 📦 New Components

### 1. **CORELogo** (`src/components/CORELogo.jsx`)
Displays the CORE logo with optional text.

```jsx
import CORELogo from './components/CORELogo';

// Full branding with text
<CORELogo size="md" showText={true} />

// Icon only
<CORELogo size="lg" variant="icon" />

// Sizes: xs, sm, md, lg, xl
```

### 2. **COREButton** (`src/components/COREButton.jsx`)
Standardized button with CORE styling.

```jsx
import COREButton from './components/COREButton';

<COREButton variant="primary" size="md">
  Click Me
</COREButton>

// Variants: primary, secondary, outline, ghost
// Sizes: sm, md, lg, xl
// Props: loading, disabled, fullWidth, icon
```

### 3. **CORELeftSidebar** (`src/components/CORELeftSidebar.jsx`)
Individual app sidebar with CORE branding, preserves Google Ads.

```jsx
import CORELeftSidebar from './components/CORELeftSidebar';

<CORELeftSidebar 
  app={microApp} 
  isPro={false}
  backTo="/core-dashboard"
/>
```

### 4. **COREHomeSidebar** (`src/components/COREHomeSidebar.jsx`)
Sidebar with micro-app navigation links.

```jsx
import COREHomeSidebar from './components/COREHomeSidebar';

<COREHomeSidebar app={currentApp} isPro={false} />
```

---

## 🗺️ New Routes

### Main Hub
- **Route**: `/core-dashboard`
- **Component**: `COREDashboard`
- **Purpose**: Displays all 10 micro-apps in a dashboard grid
- **Features**:
  - Search functionality
  - Apps organized by status (Live/Coming Soon)
  - Beautiful card UI
  - Direct links to individual apps

### Individual App Pages
- **Route**: `/core/apps/:appId`
- **Component**: `COREMicroApp`
- **Purpose**: Individual micro-app with CORE theming
- **Features**:
  - CORELeftSidebar with Google Ads
  - App information display
  - Back button to dashboard
  - Pro user support

---

## 📄 Example Pages

### COREDashboard Page (`src/pages/COREDashboard.jsx`)
Landing page showing all micro-apps.

**Features**:
- Grid layout with app cards
- Status badges (Live/Coming Soon)
- Search bar for finding apps
- Icon-based visual design
- Pricing information display

**Navigation**:
```jsx
const handleAppClick = (appId) => {
  navigate(`/core/apps/${appId}`);
};
```

### COREMicroApp Page (`src/pages/COREMicroApp.jsx`)
Wrapper for individual micro-app pages with CORE theme.

**Features**:
- CORELeftSidebar (with Google Ads intact)
- App information display
- Status badges
- Back navigation
- Preserves existing app functionality

---

## 🎯 Micro-Apps Available

| Icon | App Name | Status | Value Proposition |
|------|----------|--------|-------------------|
| 📋 | Resume Screener Lite | Live | JD vs Resume quick match |
| ❓ | Interview Question Generator | Live | Role-based question generation |
| 📝 | Offer Letter Generator | Build | Professional offer letters |
| 💰 | Salary Benchmark Tool | Build | Salary fairness analysis |
| 🔄 | Candidate Follow-up Tracker | Build | Never forget follow-ups |
| 📜 | HR Policy Builder | Build | Compliant company policies |
| 🚪 | Exit Interview Analyzer | Build | Analyze exit feedback |
| 📅 | Attendance Exception Tracker | Build | Track patterns |
| ⭐ | Performance Review Helper | Build | Self + manager reviews |
| 📄 | Resume Formatter Pro | Build | ATS-friendly formatting |

---

## 🔧 Usage Examples

### Using CORE Theme Utilities

```jsx
import { 
  CORE_COLORS, 
  buttonVariants, 
  getStatusBadgeClass 
} from '../config/coreTheme';

// Get a color
const redColor = CORE_COLORS.red[500];

// Get button variant class
const primaryBtn = buttonVariants.primary;

// Get status badge
<div className={getStatusBadgeClass('Live')}>
  Live
</div>
```

### Creating a CORE Styled Component

```jsx
import CORELogo from './CORELogo';
import COREButton from './COREButton';
import { CORE_COLORS } from '../config/coreTheme';

export default function MyComponent() {
  return (
    <div className="bg-gradient-to-br from-red-50 to-white">
      <CORELogo size="lg" />
      <p className="text-gray-900">Welcome to CORE</p>
      <COREButton variant="primary">
        Get Started
      </COREButton>
    </div>
  );
}
```

### Navigation to CORE Apps

```jsx
import { useNavigate } from 'react-router-dom';

export default function MyApp() {
  const navigate = useNavigate();

  const handleOpenApp = (appId) => {
    navigate(`/core/apps/${appId}`);
  };

  return (
    <button onClick={() => handleOpenApp('resume-screener')}>
      Open Resume Screener
    </button>
  );
}
```

---

## 🎨 Design Guidelines

### Colors
- **Use red-500** for primary buttons and actions
- **Use red-600/700** for hover/active states
- **Use gray-100/200** for backgrounds
- **Use gray-900** for text

### Spacing
- Consistent 1rem (16px) gaps between sections
- 0.5rem (8px) for tight spacing
- 2rem (32px) for major section separations

### Typography
- **Headings**: Bold, use gray-900
- **Body Text**: Regular weight, use gray-700/800
- **Secondary Text**: Gray-600, smaller size

### Components
- **Buttons**: Always use COREButton component
- **Logos**: Always use CORELogo component
- **Sidebars**: Use CORELeftSidebar or COREHomeSidebar

---

## ✅ Preserved Features

### Google Ads
- ✅ Fully functional in CORELeftSidebar
- ✅ Ad carousel rotates every 6 seconds
- ✅ Ad indicators show current ad
- ✅ Hidden for Pro users
- ✅ Styled with CORE colors, functionality unchanged

### Pro User Support
- ✅ Pro badge displayed with CORE styling
- ✅ Ads hidden for Pro users
- ✅ Unlimited access message displayed

### Existing Apps
- ✅ All 10 micro-apps preserved
- ✅ Original implementations unchanged
- ✅ New CORE wrapper applied on top
- ✅ ATRact versions still available at `/customer/apps/:appId`

---

## 🚀 Deployment Checklist

- [ ] All CORE components created and styled
- [ ] Routes added to App.jsx
- [ ] Tailwind colors updated
- [ ] CORE logo displayed consistently
- [ ] Google Ads functioning with new styling
- [ ] COREDashboard loads all micro-apps
- [ ] Navigation between apps working
- [ ] Back button functionality verified
- [ ] Mobile responsive tested
- [ ] Pro user flow verified

---

## 📱 Responsive Design

All CORE components are responsive and work on:
- **Mobile**: 375px (xs)
- **Tablets**: 640px-768px (sm-md)
- **Laptops**: 1024px (lg)
- **Desktops**: 1280px+ (xl-3xl)

**CORELeftSidebar** is fixed at 320px width (w-80) with appropriate margins on content.

---

## 🔗 Navigation Structure

```
/login → /signup → /customer (existing)
                ↓
        /core-dashboard (new)
                ↓
        /core/apps/:appId (new)
                ↓
        [App Content + CORELeftSidebar]
                ↓
        Back to /core-dashboard
```

---

## 📞 Support & Next Steps

### For Questions About:
- **Component Usage**: Check component JSDoc comments
- **Color Scheme**: Reference `src/config/coreTheme.js`
- **Routes**: See `src/App.jsx` routing section
- **Individual Apps**: Check `src/data/microApps.js`

### Potential Future Enhancements:
- [ ] Email templates with CORE branding
- [ ] Customer dashboard integration with CORE hub
- [ ] Analytics tracking for CORE routes
- [ ] CORE-themed status dashboard
- [ ] Admin panel redesign with CORE colors

---

## 📄 File Structure

```
src/
├── components/
│   ├── CORELogo.jsx ..................... CORE logo component
│   ├── COREButton.jsx ................... Standardized button
│   ├── CORELeftSidebar.jsx .............. App sidebar with ads
│   ├── COREHomeSidebar.jsx .............. Navigation sidebar
│   └── [other existing components]
├── pages/
│   ├── COREDashboard.jsx ................ Main hub page
│   ├── COREMicroApp.jsx ................. App wrapper
│   └── [other existing pages]
├── config/
│   ├── coreTheme.js ..................... Theme utilities
│   ├── routes.js ....................... Route constants
│   └── api.js .......................... API config
├── data/
│   └── microApps.js .................... Micro-app data
└── App.jsx ............................. Main app with routes
```

---

Last Updated: April 4, 2026
CORE Careers Platform v2.0
