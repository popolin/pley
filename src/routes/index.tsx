import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/Home';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
);

export default AppRoutes;
