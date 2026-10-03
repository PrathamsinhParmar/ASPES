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
        title="Login – ASPES KPGU AI Evaluation Portal"
        description="Log in to ASPES, KPGU's AI-based project evaluation system, to submit and track your academic project assessments."
        keywords="aspes kpgu, kpgu ai portal, ai evaluation portal"
        canonicalPath="/login"
        schema={loginSchema}
      />
      <Login />
    </>
  );
};

export default LoginPage;
