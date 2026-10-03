import React from 'react';
import Register from '../components/Auth/Register';
import SEO from '../components/Common/SEO';

const RegisterPage = () => {
  return (
    <>
      <SEO
        title="Register – ASPES | AI Project Evaluation System"
        description="Create an ASPES student or faculty account. Submit codebases for automated AST grading, multi-model AI plagiarism detection, and comprehensive feedback."
        canonicalPath="/register"
        keywords="ASPES register, create ASPES account, academic project evaluation registration, student faculty code grading portal"
      />
      <Register />
    </>
  );
};

export default RegisterPage;
