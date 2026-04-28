# ORE Careers: Platform Redesign & Integration Guide

## 🎯 Overview

The ORE Careers platform has been redesigned with new branding, colors, and a modern micro-app integration system. All micro-apps are now accessible from a centralized hub while preserving the original app implementations and Google Ads functionality.

---

## 🎨 ORE Brand Colors

### Primary Red (Main Action Color)
- **Primary**: `#ef4444` (bg-red-500)
- **Hover**: `#dc2626` (bg-red-600)
- **Active**: `#b91c1c` (bg-red-700)

### ORE Gray (Accents)
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
import { ORE_COLORS } from '../config/oreTheme';
const primaryRed = ORE_COLORS.red[500];
```

---

## 📦 New Components

### 1. **OReLogo** (`src/components/OReLogo.jsx`)
Displays the ORE logo with optional text.

```jsx
import OReLogo from './components/OReLogo';

// Full branding with text
<OReLogo size="md" showText={true} />

// Icon only
<OReLogo size="lg" variant="icon" />

// Sizes: xs, sm, md, lg, xl
```

### 2. **OREButton** (`src/components/OREButton.jsx`)
Standardized button with ORE styling.

```jsx
import OREButton from './components/OREButton';

<OREButton variant="primary" size="md">
  Click Me
</OREButton>

// Variants: primary, secondary, outline, ghost
// Sizes: sm, md, lg, xl
// Props: loading, disabled, fullWidth, icon
```

### 3. **ORELeftSidebar** (`src/components/ORELeftSidebar.jsx`)
Individual app sidebar with ORE branding, preserves Google Ads.

```jsx
import ORELeftSidebar from './components/ORELeftSidebar';

<ORELeftSidebar 
  app={microApp} 
  isPro={false}
  backTo="/ore-dashboard"
/>
```

### 4. **OREHomeSidebar** (`src/components/OREHomeSidebar.jsx`)
Sidebar with micro-app navigation links.

```jsx
import OREHomeSidebar from './components/OREHomeSidebar';

<OREHomeSidebar app={currentApp} isPro={false} />
```

---

## 🗺️ New Routes

### Main Hub
- **Route**: `/ore-dashboard`
- **Component**: `OREDashboard`
- **Purpose**: Displays all 10 micro-apps in a dashboard grid
- **Features**:
  - Search functionality
  - Apps organized by status (Live/Coming Soon)
  - Beautiful card UI
  - Direct links to individual apps

### Individual App Pages
- **Route**: `/ore/apps/:appId`
- **Component**: `OREMicroApp`
- **Purpose**: Individual micro-app with ORE theming
- **Features**:
  - ORELeftSidebar with Google Ads
  - App information display
  - Back button to dashboard
  - Pro user support

---

## 📄 Example Pages

### OREDashboard Page (`src/pages/OREDashboard.jsx`)
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
  navigate(`/ore/apps/${appId}`);
};
```

### OREMicroApp Page (`src/pages/OREMicroApp.jsx`)
Wrapper for individual micro-app pages with ORE theme.

**Features**:
- ORELeftSidebar (with Google Ads intact)
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

### Using ORE Theme Utilities

```jsx
import { 
  ORE_COLORS, 
  buttonVariants, 
  getStatusBadgeClass 
} from '../config/oreTheme';

// Get a color
const redColor = ORE_COLORS.red[500];

// Get button variant class
const primaryBtn = buttonVariants.primary;

// Get status badge
<div className={getStatusBadgeClass('Live')}>
  Live
</div>
```

### Creating an ORE Styled Component

```jsx
import OReLogo from './OReLogo';
import OREButton from './OREButton';
import { ORE_COLORS } from '../config/oreTheme';

export default function MyComponent() {
  return (
    <div className="bg-gradient-to-br from-red-50 to-white">
      <OReLogo size="lg" />
      <p className="text-gray-900">Welcome to ORE</p>
      <OREButton variant="primary">
        Get Started
      </OREButton>
    </div>
  );
}
```

### Navigation to ORE Apps

```jsx
import { useNavigate } from 'react-router-dom';

export default function MyApp() {
  const navigate = useNavigate();

  const handleOpenApp = (appId) => {
    navigate(`/ore/apps/${appId}`);
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
- **Buttons**: Always use OREButton component
- **Logos**: Always use OReLogo component
- **Sidebars**: Use ORELeftSidebar or OREHomeSidebar

---

## ✅ Preserved Features

### Google Ads
- ✅ Fully functional in ORELeftSidebar
- ✅ Ad carousel rotates every 6 seconds
- ✅ Ad indicators show current ad
- ✅ Hidden for Pro users
- ✅ Styled with ORE colors, functionality unchanged

### Pro User Support
- ✅ Pro badge displayed with ORE styling
- ✅ Ads hidden for Pro users
- ✅ Unlimited access message displayed

### Existing Apps
- ✅ All 10 micro-apps preserved
- ✅ Original implementations unchanged
- ✅ New ORE wrapper applied on top
- ✅ ATRact versions still available at `/customer/apps/:appId`

---

## 🚀 Deployment Checklist

- [ ] All ORE components created and styled
- [ ] Routes added to App.jsx
- [ ] Tailwind colors updated
- [ ] ORE logo displayed consistently
- [ ] Google Ads functioning with new styling
- [ ] OREDashboard loads all micro-apps
- [ ] Navigation between apps working
- [ ] Back button functionality verified
- [ ] Mobile responsive tested
- [ ] Pro user flow verified

---

## 📱 Responsive Design

All ORE components are responsive and work on:
- **Mobile**: 375px (xs)
- **Tablets**: 640px-768px (sm-md)
- **Laptops**: 1024px (lg)
- **Desktops**: 1280px+ (xl-3xl)

**ORELeftSidebar** is fixed at 320px width (w-80) with appropriate margins on content.

---

## 🔗 Navigation Structure

```
/login → /signup → /customer (existing)
                ↓
        /ore-dashboard (new)
                ↓
        /ore/apps/:appId (new)
                ↓
        [App Content + ORELeftSidebar]
                ↓
        Back to /ore-dashboard
```

---

## 📞 Support & Next Steps

### For Questions About:
- **Component Usage**: Check component JSDoc comments
- **Color Scheme**: Reference `src/config/oreTheme.js`
- **Routes**: See `src/App.jsx` routing section
- **Individual Apps**: Check `src/data/microApps.js`

### Potential Future Enhancements:
- [ ] Email templates with ORE branding
- [ ] Customer dashboard integration with ORE hub
- [ ] Analytics tracking for ORE routes
- [ ] ORE-themed status dashboard
- [ ] Admin panel redesign with ORE colors

---

## 📄 File Structure

```
src/
├── components/
│   ├── OReLogo.jsx ..................... ORE logo component
│   ├── OREButton.jsx ................... Standardized button
│   ├── ORELeftSidebar.jsx .............. App sidebar with ads
│   ├── OREHomeSidebar.jsx .............. Navigation sidebar
│   └── [other existing components]
├── pages/
│   ├── OREDashboard.jsx ................ Main hub page
│   ├── OREMicroApp.jsx ................. App wrapper
│   └── [other existing pages]
├── config/
│   ├── oreTheme.js ..................... Theme utilities
│   ├── routes.js ....................... Route constants
│   └── api.js .......................... API config
├── data/
│   └── microApps.js .................... Micro-app data
└── App.jsx ............................. Main app with routes
```

---

Last Updated: April 4, 2026
ORE Careers Platform v2.0
