import React from 'react';
import Login from '../components/Auth/Login';
import SEO from '../components/Common/SEO';
import { getOrganizationSchema, getBreadcrumbSchema } from '../utils/structuredData';

const loginSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    getOrganizationSchema(),
    getBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Login', path: '/login' }
    ])
  ]
};

const LoginPage = () => {
  return (
    <>
      <SEO
        title="Login – ASPES | AI Project Evaluation System"
        description="Sign in to the ASPES academic portal to review student code evaluations, inspect multi-vector AI detection telemetry, and access automated rubric scorecards."
        canonicalPath="/login"
        keywords="ASPES login, AI project evaluation login, university code grader portal, academic plagiarism detection login"
        schema={loginSchema}
      />
      <Login />
    </>
  );
};

export default LoginPage;
