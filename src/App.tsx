
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers & Layouts
import { AppProviders } from './core/contexts/AppProviders';
import { PublicLayout, DashboardLayout } from './ui/layout/MainLayouts';
import { ProtectedRoute } from './modules/auth/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Pricing from './pages/public/Pricing';
import Contact from './pages/public/Contact';
import Login from './pages/auth/Login';

// Protected Portals
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';

const App = () => {
  return (
    <AppProviders>
        <Router>
            <Routes>
                {/* Public Routes Group */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                </Route>

                {/* Protected Routes Group */}
                <Route element={<DashboardLayout />}>
                    {/* Admin */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Route>

                    {/* Client */}
                    <Route element={<ProtectedRoute requiredRole="client" />}>
                        <Route path="/client/*" element={<ClientDashboard />} />
                    </Route>

                    {/* Technician */}
                    <Route element={<ProtectedRoute requiredRole="technician" />}>
                        <Route path="/technician/*" element={<TechnicianDashboard />} />
                    </Route>
                </Route>
                
                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </AppProviders>
  );
};

export default App;
