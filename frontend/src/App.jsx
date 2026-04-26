import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/main-dashboard/Navigation';
import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import MainDashboard from './components/main-dashboard/MainDashboard';
import './App.css';

function AppContent() {
  const location = useLocation();
  

  const hideNavigation = location.pathname === '/dashboard';

  return (
    <div className="app">
      {!hideNavigation && <Navigation />}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/main-dashboard" />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/main-dashboard" element={<MainDashboard />} />
        </Routes>
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