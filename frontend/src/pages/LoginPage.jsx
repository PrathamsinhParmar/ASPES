import React from 'react';
import Login from '../components/Auth/Login';
import SEO from '../components/Common/SEO';

const LoginPage = () => {
  return (
    <>
      <SEO
        title="Login – ASPES | AI Project Evaluation System"
        description="Sign in to the ASPES academic portal to review student code evaluations, inspect multi-vector AI detection telemetry, and access automated rubric scorecards."
        canonicalPath="/login"
        keywords="ASPES login, AI project evaluation login, university code grader portal, academic plagiarism detection login"
      />
      <Login />
    </>
  );
};

export default LoginPage;
