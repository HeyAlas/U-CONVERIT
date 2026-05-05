import React from 'react';

const Hero = () => {
  const handleFileUpload = () => {
    console.log('File upload clicked');
  };

  return (
    <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Hero Text */}
          <div className="max-w-2xl">
            <h1
              className="hero-heading-shimmer text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              style={{ animation: 'fadeUp 0.7s ease both', animationDelay: '0.1s' }}
            >
              Your All-in-One <br /> Academic Power Tool
            </h1>
            <p
              className="text-lg text-gray-500 mb-8 leading-relaxed"
              style={{ animation: 'fadeUp 0.7s ease both', animationDelay: '0.25s' }}
            >
              Paraphrase, Convert, and Generate Quizzes in seconds. Built by Technologists, for Technologists.
            </p>
            <a
              className="hero-cta inline-block bg-[#8B1515] text-white px-8 py-4 rounded-md font-bold text-sm uppercase tracking-wide hover:bg-red-800 shadow-lg shadow-red-900/20"
              href="#get-started"
              style={{ animation: 'fadeUp 0.7s ease both', animationDelay: '0.4s' }}
            >
              GET STARTED NOW
            </a>
          </div>

          {/* Upload Widget */}
          <div
            className="relative"
            style={{ animation: 'fadeIn 0.9s ease both', animationDelay: '0.5s' }}
          >
            <div className="upload-widget bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto lg:ml-auto dropzone-border">
              <div className="upload-icon-ring bg-[#8B1515]/5 p-4 rounded-full">
                <svg className="w-10 h-10 text-[#8B1515]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <button
                className="upload-btn bg-[#8B1515] text-white px-10 py-3 rounded-full font-bold text-sm hover:bg-red-800"
                onClick={handleFileUpload}
              >
                Upload File
              </button>
              <p className="text-xs text-gray-400">or drop a file</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;