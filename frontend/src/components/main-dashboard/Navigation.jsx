import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              alt="CIT-U Logo" 
              className="h-10 w-auto object-contain" 
              src="logo.png"
            />
            <span className="font-bold text-[#8B1515] text-lg tracking-tight">U-ConvertIT</span>
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-sm font-medium text-gray-500 hover:text-[#8B1515] transition-colors" href="#features">
              Features
            </a>
            <a className="text-sm font-medium text-gray-500 hover:text-[#8B1515] transition-colors" href="#how-it-works">
              How It Works
            </a>
            <Link className="text-sm font-medium text-[#8B1515] hover:opacity-80 transition-colors" to="/login">
              Login
            </Link>
            <Link className="bg-[#8B1515] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-red-800 transition-all" to="/signup">
              Sign Up
            </Link>
          </div>
          
          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button 
              className="text-gray-600 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              <a className="text-sm font-medium text-gray-500 hover:text-[#8B1515] transition-colors" href="#features">
                Features
              </a>
              <a className="text-sm font-medium text-gray-500 hover:text-[#8B1515] transition-colors" href="#how-it-works">
                How It Works
              </a>
              <Link 
                className="text-sm font-medium text-[#8B1515] hover:opacity-80 transition-colors" 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                className="bg-[#8B1515] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-red-800 transition-all text-center" 
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;