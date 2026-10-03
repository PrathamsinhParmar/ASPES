import React from 'react';
import Login from '../components/Auth/Login';
import SEO from '../components/Common/SEO';

const LoginPage = () => {
  return (
    <>
      <SEO
        title="Login – ASPES | AI Project Evaluation System"
        description="Sign in to the ASPES academic portal to access automated code evaluations, AI-generated code detection scores, and university project reports."
        canonicalPath="/login"
        keywords="ASPES login, AI project evaluation login, university code grader portal, academic plagiarism detection login"
      />
      <Login />
    </>
  );
};

export default LoginPage;
