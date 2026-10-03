import React from 'react';
import Register from '../components/Auth/Register';
import SEO from '../components/Common/SEO';
import { getOrganizationSchema, getBreadcrumbSchema } from '../utils/structuredData';

const registerSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    getOrganizationSchema(),
    getBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Register', path: '/register' }
    ])
  ]
};

const RegisterPage = () => {
  return (
    <>
      <SEO
        title="Register – ASPES KPGU AI Evaluation Portal"
        description="Create your ASPES account to access KPGU's AI-powered academic project evaluation and feedback system."
        keywords="aspes kpgu project, kpgu student project ai tool, ai evaluation portal kpgu"
        canonicalPath="/register"
        schema={registerSchema}
      />
      <Register />
    </>
  );
};

export default RegisterPage;
