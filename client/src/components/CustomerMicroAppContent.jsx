/**
 * Simple content wrapper for customer micro apps
 * 
 * This component wraps micro app content without adding extra headers or sidebars.
 * The layout (header, sidebar) is handled by CustomerLayout in App.jsx.
 * 
 * Usage:
 * - Pass children (the micro app content)
 * - Content will be scrollable and properly padded
 */
export default function CustomerMicroAppContent({ children }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </div>
  );
}
