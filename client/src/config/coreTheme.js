/**
 * CORE Theme Utilities
 * Centralized theme configuration for CORE Careers branding
 */

// CORE Color Palette
export const CORE_COLORS = {
  // Primary Red - CORE Brand
  red: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#E53935',
    600: '#C62828',
    700: '#B71C1C',
    800: '#D32F2F',
    900: '#C62828',
  },
  // CORE Gray
  gray: {
    light: '#E0E0E0',
    main: '#9E9E9E',
    dark: '#4A4A4A',
  },
  // Neutrals
  neutral: {
    50: '#F5F5F5',
    100: '#EEEEEE',
    200: '#E0E0E0',
    300: '#BDBDBD',
    400: '#9E9E9E',
    500: '#757575',
    600: '#616161',
    700: '#424242',
    800: '#4A4A4A',
    900: '#4A4A4A',
  },
};

// Button Variants
export const buttonVariants = {
  primary: 'bg-[#E53935] text-white hover:bg-[#C62828] active:bg-[#B71C1C]',
  secondary: 'bg-[#E0E0E0] text-[#4A4A4A] hover:bg-[#BDBDBD] active:bg-[#9E9E9E]',
  outline: 'border-2 border-[#E53935] text-[#E53935] hover:bg-[#FFEBEE] active:bg-[#FFCDD2]',
  ghost: 'text-[#E53935] hover:bg-[#FFEBEE] active:bg-[#FFCDD2]',
};

// Text Styles
export const textStyles = {
  label: 'text-xs font-bold uppercase tracking-wider text-[#4A4A4A]',
  caption: 'text-xs text-[#9E9E9E]',
  small: 'text-sm text-[#4A4A4A]',
  body: 'text-base text-[#4A4A4A]',
  heading3: 'text-lg font-bold text-[#4A4A4A]',
  heading2: 'text-xl font-bold text-[#4A4A4A]',
  heading1: 'text-2xl font-bold text-[#4A4A4A]',
};

// Layout constants
export const CORE_LAYOUT = {
  sidebarWidth: 320, // w-80
  sidebarWidthClass: 'w-80',
  marginLeft: 'ml-80',
};

// Status Badges (CORE Palette Only)
export const statusBadges = {
  live: 'bg-red-100 text-red-700',
  building: 'bg-gray-100 text-gray-700',
  planned: 'bg-[#E0E0E0] text-[#757575]',
};

// Spacing scale (Tailwind-based)
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// Utility function: Get status badge classes
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Live':
      return statusBadges.live;
    case 'Build':
    case 'Building':
      return statusBadges.building;
    case 'Planned':
      return statusBadges.planned;
    default:
      return statusBadges.planned;
  }
};

// Utility function: Get CORE color value
export const getCOREColor = (colorName, shade = 500) => {
  const colors = {
    red: CORE_COLORS.red,
    gray: CORE_COLORS.gray,
    neutral: CORE_COLORS.neutral,
  };
  return colors[colorName]?.[shade] || CORE_COLORS.red[500];
};

// Gradient definitions
export const gradients = {
  coreHero: 'from-[#F5F5F5] to-white',
  corePrimary: 'from-[#E53935] to-[#C62828]',
  coreSubtle: 'from-[#FFEBEE] to-[#F5F5F5]',
};

export default {
  CORE_COLORS,
  buttonVariants,
  textStyles,
  CORE_LAYOUT,
  statusBadges,
  spacing,
  getStatusBadgeClass,
  getCOREColor,
  gradients,
};
