import React from 'react';
import Login from '../../components/Login';

const LoginPageWrapper: React.FC = () => (
  <div className="pp-app-shell">
    <main className="pp-page pp-page--login">
      <section className="pp-page__content">
        <Login />
      </section>
    </main>
  </div>
);

export default LoginPageWrapper;
