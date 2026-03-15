/**
 * LoadingSpinner - Full-screen or inline spinner component
 */
function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  };

  const spinner = (
    <div
      className={`spinner ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading..."
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center gap-4 z-50">
        <div className="w-12 h-12 border-[3px] spinner" />
        <p className="text-gray-400 text-sm animate-pulse">Loading ASPES...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}

export default LoadingSpinner;
