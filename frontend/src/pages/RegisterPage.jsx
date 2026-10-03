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
        title="Register – ASPES | AI Project Evaluation System"
        description="Create an ASPES student or faculty account. Submit codebases for automated AST grading, multi-model AI plagiarism detection, and comprehensive feedback."
        canonicalPath="/register"
        keywords="ASPES register, create ASPES account, academic project evaluation registration, student faculty code grading portal"
        schema={registerSchema}
      />
      <Register />
    </>
  );
};

export default RegisterPage;
