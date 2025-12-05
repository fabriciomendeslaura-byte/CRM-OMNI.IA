import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CRMProvider, useCRM } from './contexts/CRMContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Login from './pages/Login';

// Componente para proteger rotas
const ProtectedRoute = () => {
  const { currentUser, isLoading } = useCRM();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CRMProvider>
          <HashRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="admin" element={<Admin />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>
            </Routes>
          </HashRouter>
        </CRMProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;