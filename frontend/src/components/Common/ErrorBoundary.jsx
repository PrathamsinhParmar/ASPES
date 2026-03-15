import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 font-black text-3xl">
              !
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Application Interrupted</h1>
            <p className="text-gray-500 font-medium leading-relaxed mb-8">
              A critical rendering error occurred. Our engineers have been notified.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
            >
              Refresh Session
            </button>
            <p className="mt-6 text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Error Hash: {btoa(this.state.error?.message || 'unknown').substring(0, 8)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
