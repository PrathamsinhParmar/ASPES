import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-9xl font-black text-gray-200">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
      <p className="text-gray-500 mt-2 max-w-md">Sorry, the page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
