import React from 'react';
import Register from '../components/Auth/Register';
import SEO from '../components/Common/SEO';

const RegisterPage = () => {
  return (
    <>
      <SEO
        title="Register | Create Student or Faculty Account"
        description="Join ASPES (AI Smart Academic Project Evaluation System). Create a student or faculty account to submit projects, run automated code evaluations, and detect plagiarism."
        canonical="/register"
        keywords="ASPES register, sign up ASPES, academic project evaluation account, automated grading student registration"
      />
      <Register />
    </>
  );
};

export default RegisterPage;
