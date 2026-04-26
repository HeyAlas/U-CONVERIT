import React from 'react';

const HowItWorks = () => {
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
        <h2 className="text-3xl font-extrabold text-[#8B1515] mb-4">Basic steps toward success</h2>
        <p className="text-gray-500 mb-16 max-w-lg mx-auto">
          Our streamlined process makes it easy to handle your academic load and achieve your goals.
        </p>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 text-left">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <span className="step-number text-2xl">{step.number}</span>
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