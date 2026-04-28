/**
 * CORE Careers Logo Component
 * This component displays the CORE logo with proper branding colors
 * Used throughout the platform for consistent branding
 */

export default function CORELogo({ size = 'md', className = '', showText = true, variant = 'full' }) {
  // Size mappings
  const sizeMap = {
    xs: { container: 'w-8 h-8', text: 'text-sm', logo: 24 },
    sm: { container: 'w-10 h-10', text: 'text-base', logo: 32 },
    md: { container: 'w-12 h-12', text: 'text-lg', logo: 40 },
    lg: { container: 'w-16 h-16', text: 'text-xl', logo: 56 },
    xl: { container: 'w-20 h-20', text: 'text-2xl', logo: 80 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Logo variants
  if (variant === 'icon') {
    return (
      <svg
        width={currentSize.logo}
        height={currentSize.logo}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Gray boxes */}
        <rect x="4" y="4" width="12" height="12" fill="#8B8B8B" />
        <rect x="20" y="4" width="12" height="12" fill="#8B8B8B" />
        
        {/* Red accent box */}
        <rect x="36" y="4" width="12" height="12" fill="#EF4444" />
        
        {/* Bottom gray boxes */}
        <rect x="4" y="20" width="12" height="12" fill="#8B8B8B" />
        <rect x="20" y="20" width="12" height="12" fill="#8B8B8B" />
        <rect x="36" y="20" width="12" height="12" fill="#EF4444" />
        
        {/* Additional accent row */}
        <rect x="4" y="36" width="12" height="12" fill="#8B8B8B" />
        <rect x="20" y="36" width="12" height="12" fill="#8B8B8B" />
        <rect x="36" y="36" width="12" height="12" fill="#EF4444" />
      </svg>
    );
  }

  // Full branding with text
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={currentSize.logo}
        height={currentSize.logo}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={currentSize.container}
      >
        {/* Gray boxes */}
        <rect x="4" y="4" width="12" height="12" fill="#8B8B8B" />
        <rect x="20" y="4" width="12" height="12" fill="#8B8B8B" />
        
        {/* Red accent box */}
        <rect x="36" y="4" width="12" height="12" fill="#EF4444" />
        
        {/* Bottom gray boxes */}
        <rect x="4" y="20" width="12" height="12" fill="#8B8B8B" />
        <rect x="20" y="20" width="12" height="12" fill="#8B8B8B" />
        <rect x="36" y="20" width="12" height="12" fill="#EF4444" />
        
        {/* Additional accent row */}
        <rect x="4" y="36" width="12" height="12" fill="#8B8B8B" />
        <rect x="20" y="36" width="12" height="12" fill="#8B8B8B" />
        <rect x="36" y="36" width="12" height="12" fill="#EF4444" />
      </svg>

      {showText && (
        <div>
          <div className={`font-bold text-gray-900 ${currentSize.text}`}>CORE Careers</div>
          <div className="text-xs text-gray-600">A Core Company</div>
        </div>
      )}
    </div>
  );
}
