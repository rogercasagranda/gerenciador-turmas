// frontend/src/App.tsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );
};

export default App;
