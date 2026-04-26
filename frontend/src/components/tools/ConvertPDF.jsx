import { useState } from 'react';
import './Tool.css';

export function ConvertPDF() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertType, setConvertType] = useState("pdf-to-text");

  const conversionOptions = [
    { value: "pdf-to-text", label: "PDF → Text", accept: ".pdf" },
    { value: "pdf-to-word", label: "PDF → Word", accept: ".pdf" },
    { value: "word-to-pdf", label: "Word → PDF", accept: ".doc,.docx" }
  ];

  const currentOption = conversionOptions.find(opt => opt.value === convertType);

  const handleConvert = () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setTimeout(() => {
      setOutputText(`Converted: ${selectedFile.name}`);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="tool-container">
      <select value={convertType} onChange={(e) => setConvertType(e.target.value)}>
        {conversionOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input type="file" accept={currentOption.accept} onChange={(e) => setSelectedFile(e.target.files[0])} />

      <button onClick={handleConvert} disabled={!selectedFile || isProcessing}>
        {isProcessing ? 'Converting...' : 'Convert'}
      </button>

      <textarea value={outputText} readOnly />
    </div>
  );
}