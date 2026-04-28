/**
 * ORE Card Component
 * Reusable card component with ORE theming
 */

export default function ORECard({
  title,
  subtitle,
  description,
  icon,
  badge,
  badgeColor = 'emerald',
  footer,
  onClick,
  className = '',
  children,
  variant = 'elevated', // elevated, outlined, filled
  hoverable = true,
  disabled = false,
}) {
  const baseClasses = 'rounded-xl overflow-hidden transition-all duration-200';

  const variantClasses = {
    elevated: 'bg-white border-2 border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg hover:border-[#E53935]',
    outlined: 'bg-transparent border-2 border-[#E53935] hover:border-[#C62828]',
    filled: 'bg-[#F5F5F5] border-2 border-[#E0E0E0] hover:bg-[#EEEEEE]',
  };

  const interactiveClasses = hoverable && !disabled
    ? 'cursor-pointer hover:-translate-y-1'
    : disabled ? 'opacity-60 cursor-not-allowed' : '';

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.elevated}
    ${interactiveClasses}
    ${className}
  `.trim();

  const badgeColorMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-[#FFEBEE] text-[#E53935]',
    gray: 'bg-gray-100 text-gray-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div
      className={classes}
      onClick={!disabled ? onClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {/* Header Section */}
      {(title || subtitle || badge || icon) && (
        <div className="px-6 py-4 border-b-2 border-[#E0E0E0] bg-[#F5F5F5]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-3 flex-1">
              {icon && <span className="text-3xl flex-shrink-0">{icon}</span>}
              <div className="flex-1 min-w-0">
                {title && <h3 className="font-bold text-lg text-[#4A4A4A]">{title}</h3>}
                {subtitle && <p className="text-xs text-[#9E9E9E] mt-1">{subtitle}</p>}
              </div>
            </div>
            {badge && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${badgeColorMap[badgeColor]}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="px-6 py-4">
        {description && <p className="text-sm text-[#9E9E9E]">{description}</p>}
        {children}
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="px-6 py-3 border-t-2 border-[#E0E0E0] bg-[#F5F5F5]">
          {typeof footer === 'string' ? (
            <p className="text-sm font-semibold text-[#E53935]">{footer}</p>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
}
