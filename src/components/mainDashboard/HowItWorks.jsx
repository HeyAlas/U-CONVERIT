import React, { useEffect, useRef } from 'react';

const HowItWorks = () => {
  const stepsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const steps = entry.target.querySelectorAll('.step-item');
            steps.forEach((step, i) => {
              const fromLeft = i % 2 === 0;
              step.style.animation = `${fromLeft ? 'slideInLeft' : 'slideInRight'} 0.65s ease both`;
              step.style.animationDelay = `${i * 0.15}s`;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (stepsRef.current) observer.observe(stepsRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: '1',
      title: 'Upload Your Materials',
      description: 'Drag and drop your messy .pptx slides, lecture PDFs, or even photos of your handwritten notes into our secure dropzone.'
    },
    {
      number: '2',
      title: 'Choose Your Power-Up',
      description: 'Select your tool—convert to PDF, generate a practice quiz for your next departmental exam, or use the Wildcat Paraphraser to polish your essay.'
    },
    {
      number: '3',
      title: 'Refine & Humanize',
      description: 'Use our built-in "Humanizer" and "OCR" features to ensure your documents are perfectly formatted and read naturally.'
    },
    {
      number: '4',
      title: 'Download & Dominate',
      description: 'Get your processed files in seconds. Save your custom quizzes to your personal vault and start studying like a CIT-U topnotcher.'
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="text-3xl font-extrabold text-[#8B1515] mb-4"
          style={{ opacity: 0 }}
          ref={(el) => {
            if (el) {
              const obs = new IntersectionObserver(([e]) => {
                if (e.isIntersecting) {
                  el.style.animation = 'fadeUp 0.6s ease both';
                  obs.disconnect();
                }
              }, { threshold: 0.5 });
              obs.observe(el);
            }
          }}
        >
          Basic steps toward success
        </h2>
        <p
          className="text-gray-500 mb-16 max-w-lg mx-auto"
          style={{ opacity: 0 }}
          ref={(el) => {
            if (el) {
              const obs = new IntersectionObserver(([e]) => {
                if (e.isIntersecting) {
                  el.style.animation = 'fadeUp 0.6s ease both';
                  el.style.animationDelay = '0.15s';
                  obs.disconnect();
                }
              }, { threshold: 0.5 });
              obs.observe(el);
            }
          }}
        >
          Our streamlined process makes it easy to handle your academic load and achieve your goals.
        </p>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 text-left" ref={stepsRef}>
          {steps.map((step, index) => (
            <div
              key={index}
              className="step-item flex items-start gap-4"
              style={{ opacity: 0 }}
            >
              {/* step-number picks up the looping glow from MainDashboard styles */}
              <span className="step-number text-2xl font-extrabold">{step.number}</span>
              <div>
                <h3 className="font-bold text-[#8B1515] mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;