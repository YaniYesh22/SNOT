import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotebookDetailPage from './pages/NotebookDetailPage';
import React from 'react';
import SettingsPage from './pages/SettingsPage';
import TopicMapPage from './pages/TopicMapPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/topic-map" element={<TopicMapPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notebook/:id" element={<NotebookDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;