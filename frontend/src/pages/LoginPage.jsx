import React from 'react';
import Login from '../components/Auth/Login';
import SEO from '../components/Common/SEO';

const LoginPage = () => {
  return (
    <>
      <SEO
        title="Login | AI Academic Project Evaluation Portal"
        description="Access your ASPES account. Secure AI-powered academic project grading, multi-model plagiarism detection, and automated feedback for students and faculty."
        canonical="/login"
        keywords="ASPES login, AI project evaluation, academic code grading, automated grading portal, student faculty login"
      />
      <Login />
    </>
  );
};

export default LoginPage;
