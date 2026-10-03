import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/Common/SEO';

const NotFoundPage = () => {
  return (
    <>
      <SEO
        title="Page Not Found – ASPES"
        description="The page you're looking for doesn't exist on ASPES."
        keywords=""
        canonicalPath="/404"
        noindex={true}
      />
      <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <h1 className="text-9xl font-extrabold text-indigo-500/20 dark:text-indigo-400/20 select-none">404</h1>
        <h2 className="text-3xl font-bold mt-2">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Sorry, the page you are looking for doesn&apos;t exist, has been removed, or is private.
        </p>
        <Link
          to="/"
          className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
        >
          Return to ASPES Portal
        </Link>
      </div>
    </>
  );
};

export default NotFoundPage;
