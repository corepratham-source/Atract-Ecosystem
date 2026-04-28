/**
 * CORE Button Component
 * Standardized button with CORE branding and consistent styling
 */

export default function COREButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  // Size mappings
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Variant mappings
  const variantClasses = {
    primary: 'bg-[#E53935] text-white hover:bg-[#C62828] active:bg-[#B71C1C] disabled:bg-gray-400',
    secondary: 'bg-[#E0E0E0] text-[#4A4A4A] hover:bg-[#BDBDBD] active:bg-[#9E9E9E] disabled:bg-gray-300',
    outline: 'border-2 border-[#E53935] text-[#E53935] hover:bg-[#FFEBEE] active:bg-[#FFCDD2] disabled:border-gray-300 disabled:text-gray-400',
    ghost: 'text-[#E53935] hover:bg-[#FFEBEE] active:bg-[#FFCDD2] disabled:text-gray-400',
  };

  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:ring-offset-2';

  const classes = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.primary}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
