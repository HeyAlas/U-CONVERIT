import React from 'react';
import Hero from './Hero'
import FeaturedTools from './FeaturedTools';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

function MainDashboard() {
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Hero />
      <FeaturedTools />
      <HowItWorks />
      <Footer />
    </div>
  );
}

export default MainDashboard;