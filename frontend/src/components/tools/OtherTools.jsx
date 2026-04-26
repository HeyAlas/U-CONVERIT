/*import { useState } from 'react';
import './Tool.css';

export function Humanizer() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleHumanize = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setOutputText(inputText);
      setIsProcessing(false);
    }, 1000);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInputText(text);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="tool-container">
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            AI-Generated Text
          </span>
          <div className="panel-actions">
            <button className="btn-secondary" onClick={handlePaste}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
              Paste
            </button>
            <button className="btn-secondary" onClick={handleClear} disabled={!inputText}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Clear
            </button>
          </div>
        </div>
        <div className="panel-body">
          <textarea
            className="tool-textarea"
            placeholder="Paste AI-generated text here to make it sound more human..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <div className="panel-footer">
          <span className="char-count">{inputText.length} characters</span>
          <button className="btn-primary" onClick={handleHumanize} disabled={!inputText.trim() || isProcessing}>
            {isProcessing ? 'Processing...' : 'Humanize'}
          </button>
        </div>
      </div>

      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            Humanized Text
          </span>
          <div className="panel-actions">
            <button className="btn-secondary" onClick={handleCopy} disabled={!outputText}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy
            </button>
          </div>
        </div>
        <div className="panel-body">
          <textarea className="tool-textarea" placeholder="Humanized text will appear here..." value={outputText} readOnly />
        </div>
        <div className="panel-footer">
          <span className="char-count">{outputText.length} characters</span>
        </div>
      </div>

      {showToast && <div className="toast">Copied to clipboard!</div>}
    </div>
  );
}

export function OCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setTimeout(() => {
      setOutputText('Extracted text from your image will appear here.\n\nConnect this to your OCR backend API.');
      setIsProcessing(false);
    }, 1500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            OCR Image Upload
          </span>
        </div>
        <div className="panel-note">Upload a screenshot or photo and extract the text in one click.</div>
        <div className="panel-body">
          <label className={`upload-area ${selectedFile ? 'has-file' : ''}`}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <div className="upload-content">
              <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <p className="upload-text">Drop an image here or click to browse.</p>
              <p className="upload-hint">PNG, JPG up to 10MB</p>
              {selectedFile && <p className="file-name">{selectedFile.name}</p>}
              {preview && <img src={preview} alt="Preview" className="image-preview" />}
            </div>
          </label>
        </div>
        <div className="panel-footer">
          <span className="file-status">{selectedFile ? 'Ready to extract text' : 'No image selected yet'}</span>
          <button className="btn-primary" onClick={handleExtract} disabled={!selectedFile || isProcessing}>
            {isProcessing ? 'Extracting...' : 'Extract Text'}
          </button>
        </div>
      </div>

      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            Extracted Text
          </span>
          <div className="panel-actions">
            <button className="btn-secondary" onClick={handleCopy} disabled={!outputText}>Copy</button>
          </div>
        </div>
        <div className="panel-body">
          <textarea className="tool-textarea" placeholder="Extracted text will appear here..." value={outputText} readOnly />
        </div>
        <div className="panel-footer">
          <span className="char-count">{outputText.length} characters</span>
        </div>
      </div>

      {showToast && <div className="toast">Copied to clipboard!</div>}
    </div>
  );
}

export function QuizMaker() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setOutputText(`Generated ${questionCount} quiz questions:\n\n1. Sample question from your content?\n   A) Option A\n   B) Option B\n   C) Option C\n   D) Option D\n\n   Answer: A`);
      setIsProcessing(false);
    }, 1500);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInputText(text);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            Quiz Maker
          </span>
          <div className="panel-actions">
            <button className="btn-secondary" onClick={handlePaste}>Paste Notes</button>
          </div>
        </div>
        <div className="panel-note">Turn your lesson notes into quiz questions, fast.</div>
        <div className="panel-body">
          <textarea
            className="tool-textarea"
            placeholder="Paste your notes, textbook content, or study material here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="panel-row">
            <div>
              <label className="question-label">Number of questions</label>
              <select
                className="select-input"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </div>
        <div className="panel-footer">
          <div className="file-status">{inputText ? 'Ready to generate' : 'Enter content to create questions'}</div>
          <button className="btn-primary" onClick={handleGenerate} disabled={!inputText.trim() || isProcessing}>
            {isProcessing ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      </div>

      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            Generated Quiz
          </span>
          <div className="panel-actions">
            <button className="btn-secondary" onClick={handleCopy} disabled={!outputText}>Copy</button>
          </div>
        </div>
        <div className="panel-body">
          <textarea className="tool-textarea" placeholder="Quiz questions will appear here..." value={outputText} readOnly />
        </div>
        <div className="panel-footer">
          <span className="char-count">{outputText.length} characters</span>
        </div>
      </div>

      {showToast && <div className="toast">Copied to clipboard!</div>}
    </div>
  );
}
export function ConvertPDF() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [convertType, setConvertType] = useState("pdf-to-text");

  const conversionOptions = [
    { value: "pdf-to-text", label: "PDF → Text", accept: ".pdf" },
    { value: "pdf-to-word", label: "PDF → Word (.docx)", accept: ".pdf" },
    { value: "pdf-to-excel", label: "PDF → Excel (.xlsx)", accept: ".pdf" },
    { value: "word-to-pdf", label: "Word → PDF", accept: ".doc,.docx" },
    { value: "excel-to-pdf", label: "Excel → PDF", accept: ".xls,.xlsx" }
  ];

  const currentOption = conversionOptions.find(opt => opt.value === convertType);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    // 🔥 Replace this with real API call later
    setTimeout(() => {
      setOutputText(
        `✅ Conversion: ${currentOption.label}\n\n` +
        `File: ${selectedFile.name}\n\n` +
        `Result will come from API here.`
      );
      setIsProcessing(false);
    }, 1500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };
*/
/*
  return (
    <div className="tool-container">
      
      {/* LEFT PANEL *//*}/*
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">File Converter</span>
        </div>

        {/* 🔽 NEW DROPDOWN *//*}/*
        <div style={{ padding: "12px 14px" }}>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Conversion Type:</label>
          <select
            value={convertType}
            onChange={(e) => {
              setConvertType(e.target.value);
              setSelectedFile(null); // reset file when changing type
            }}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "8px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              fontSize: 13
            }}
          >
            {conversionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-body">
          <label className={`upload-area ${selectedFile ? 'has-file' : ''}`}>
            <input
              type="file"
              accept={currentOption.accept}
              onChange={handleFileChange}
            />
            <div className="upload-content">
              <p className="upload-text">Upload file</p>
              <p className="upload-hint">{currentOption.accept} only</p>
              {selectedFile && <p className="file-name">{selectedFile.name}</p>}
            </div>
          </label>
        </div>

        <div className="panel-footer">
          <span className="file-status">
            {selectedFile ? 'Ready to convert' : 'Select a file'}
          </span>
          <button
            className="btn-primary"
            onClick={handleConvert}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? 'Converting...' : 'Convert'}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL *//*}/*
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">Converted Output</span>
          <div className="panel-actions">
            <button
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!outputText}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="panel-body">
          <textarea
            className="tool-textarea"
            placeholder="Converted output will appear here..."
            value={outputText}
            readOnly
          />
        </div>

        <div className="panel-footer">
          <span className="char-count">{outputText.length} characters</span>
        </div>
      </div>

      {showToast && <div className="toast">Copied to clipboard!</div>}
    </div>
  );
  /*
}*/
