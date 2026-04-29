import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/main-dashboard/Navigation';
import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import MainDashboard from './components/main-dashboard/MainDashboard';
import PageTransition from './components/PageTransition';
import Admin from './admin/Adminpage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const hideNavigation = ['/dashboard', '/admin-dashboard'].includes(location.pathname);

  return (
    <div className="app">
      {!hideNavigation && <Navigation />}
      <main>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/main-dashboard" />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/main-dashboard" element={<MainDashboard />} />
            <Route path="/admin-dashboard" element={<Admin />} />
          </Routes>
        </PageTransition>
      </main>
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