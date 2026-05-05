import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import PageTransition from './components/common/PageTransition';
import MainDashboard from './components/mainDashboard/MainDashboard';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import CheckEmail from './components/auth/CheckEmail';
import Dashboard from './components/dashboard/Dashboard';
import AdminPage from './components/admin/AdminPage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const hideNavAndFooter = ['/dashboard', '/admin-dashboard'].includes(location.pathname);

  return (
    <div className="app min-h-screen flex flex-col">
      {!hideNavAndFooter && <Navigation />}
      <main className="flex-1">
        <PageTransition>
          <Routes>
            <Route path="/" element={<MainDashboard />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminPage />} />   {/* ← UPDATED */}
          </Routes>
        </PageTransition>
      </main>
      {!hideNavAndFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;