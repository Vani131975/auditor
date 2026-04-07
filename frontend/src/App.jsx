import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import UploadPage from './pages/UploadPage';
import CompliancePage from './pages/CompliancePage';
import PartiesPage from './pages/PartiesPage';
import SummaryPage from './pages/SummaryPage';
import AdminDashboard from './pages/AdminDashboard';
import HistoryPage from './pages/HistoryPage';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-white flex flex-col font-sans">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/parties" element={<PartiesPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
