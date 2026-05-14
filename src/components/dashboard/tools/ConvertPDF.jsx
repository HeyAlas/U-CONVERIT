import { useState, useRef } from 'react';
import { 
  Upload, FileText, Download, Copy, Check, 
  ArrowRight, Info, X, AlertCircle, Sparkles 
} from 'lucide-react';
import '../../../styles/dashboard.css';

const CONVERSION_TYPES = [
  {
    id: 'pdf-to-word',
    label: 'PDF → Word',
    accept: '.pdf',
    inputLabel: 'PDF File',
    outputLabel: 'Word Document',
    outputExt: '.docx',
    hint: 'PDF',
  },
  {
    id: 'word-to-pdf',
    label: 'Word → PDF',
    accept: '.doc,.docx',
    inputLabel: 'Word File',
    outputLabel: 'PDF File',
    outputExt: '.pdf',
    hint: 'DOC, DOCX',
  },
  {
    id: 'pdf-to-text',
    label: 'PDF → Text',
    accept: '.pdf',
    inputLabel: 'PDF File',
    outputLabel: 'Text File',
    outputExt: '.txt',
    hint: 'PDF',
  },
];

const LOADING_PHRASES = [
  'Reading your file...',
  'Processing content...',
  'Almost ready...',
  'Finalizing output...',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:8000/api';

function ConvertPDF() {
  const [convertType, setConvertType]     = useState('pdf-to-word');
  const [selectedFile, setSelectedFile]   = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [isDone, setIsDone]               = useState(false);
  const [loadPhrase, setLoadPhrase]       = useState(LOADING_PHRASES[0]);
  const [copied, setCopied]               = useState(false);
  const [outputFileName, setOutputFileName] = useState('');
  const [isDragging, setIsDragging]       = useState(false);
  const [error, setError]                 = useState('');
  const [successFlash, setSuccessFlash]   = useState(false);

  // ── Store real converted file blob for download ──
  const convertedBlobRef = useRef(null);
  const convertedTextRef = useRef(null);  // only for pdf-to-text

  const fileInputRef   = useRef(null);
  const phraseInterval = useRef(null);

  const currentType = CONVERSION_TYPES.find(t => t.id === convertType);

  const resetOutput = () => {
    setIsDone(false);
    setOutputFileName('');
    setError('');
    convertedBlobRef.current = null;
    convertedTextRef.current = null;
  };

  const handleTypeChange = (id) => {
    setConvertType(id);
    setSelectedFile(null);
    resetOutput();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateFile = (file) => {
    setError('');
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return false;
    }
    const allowedExts = currentType.accept.split(',').map(e => e.trim());
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      setError(`Invalid file type. Please upload: ${currentType.hint}`);
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    resetOutput();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    resetOutput();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─────────────────────────────────────────────
  // ✅ REAL API CALL
  // ─────────────────────────────────────────────
  const handleConvert = async () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setIsDone(false);
    setSuccessFlash(false);
    setError('');
    convertedBlobRef.current = null;
    convertedTextRef.current = null;

    // Start loading phrase rotation
    let i = 0;
    phraseInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadPhrase(LOADING_PHRASES[i]);
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add user_id if you have auth — replace null with real user_id
      const userId = null; // e.g. from your auth context
      if (userId) formData.append('user_id', userId);

      const response = await fetch(`${API_BASE}/${convertType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to get error message from backend
        let errorMsg = 'Conversion failed. Please try again.';
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errorMsg;
        } catch (_) {}

        // Handle specific status codes
        if (response.status === 400) throw new Error(errorMsg);
        if (response.status === 429) throw new Error('Too many requests. Please wait and try again.');
        if (response.status === 500) throw new Error('Server error. Please try again.');
        throw new Error(errorMsg);
      }

      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const outName  = `${baseName}${currentType.outputExt}`;

      // ── pdf-to-text returns JSON, others return file blob ──
      if (convertType === 'pdf-to-text') {
        const data = await response.json();
        convertedTextRef.current = data.text;
      } else {
        const blob = await response.blob();
        convertedBlobRef.current = blob;
      }

      setOutputFileName(outName);
      setIsProcessing(false);
      setIsDone(true);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 600);

    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setIsProcessing(false);
      setIsDone(false);
    } finally {
      clearInterval(phraseInterval.current);
    }
  };

  // ─────────────────────────────────────────────
  // ✅ REAL DOWNLOAD
  // ─────────────────────────────────────────────
  const handleDownload = () => {
    if (!isDone) return;

    let blob;

    if (convertType === 'pdf-to-text') {
      // Text content → download as .txt
      blob = new Blob([convertedTextRef.current], { type: 'text/plain' });
    } else {
      // Real converted file blob from backend
      blob = convertedBlobRef.current;
    }

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = outputFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(outputFileName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─────────────────────────────────────────────
  // UI — exactly the same as before
  // ─────────────────────────────────────────────
  return (
    <div className="cp-container">

      {/* ── Top bar ── */}
      <header className="cp-top-bar">
        <div className="cp-type-selector">
          <span className="cp-label">
            <Info size={14} /> Convert:
          </span>
          {CONVERSION_TYPES.map(t => (
            <button
              key={t.id}
              className={`cp-pill ${convertType === t.id ? 'active' : ''}`}
              onClick={() => handleTypeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="cp-main-grid">

        {/* ── Input card ── */}
        <div className="cp-card">
          <div className="cp-card-header">
            <span className="cp-card-title">
              {currentType.inputLabel}
              <span className="cp-conversion-arrow">
                <ArrowRight size={10} />
                {currentType.outputExt}
              </span>
            </span>
            {selectedFile && (
              <button className="cp-btn-text" onClick={handleClear}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          <div className="cp-card-body">
            <div
              className={`cp-upload-area ${selectedFile ? 'has-file' : ''} ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={currentType.accept}
                onChange={handleFileChange}
                hidden
              />

              {!selectedFile ? (
                <>
                  <Upload size={48} className="cp-upload-icon" />
                  <p className="cp-upload-text">
                    {isDragging ? 'Drop file here!' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="cp-upload-hint">Accepted: {currentType.hint} · Max 10MB</p>
                </>
              ) : (
                <>
                  <FileText size={48} className="cp-upload-icon" />
                  <p className="cp-file-name">
                    <FileText size={14} />
                    {selectedFile.name}
                  </p>
                  <p className="cp-file-size">{formatFileSize(selectedFile.size)}</p>
                </>
              )}
            </div>

            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '0.5rem',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginTop: '0.75rem'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          <div className="cp-card-footer">
            <span className={`cp-status ${selectedFile ? 'ready' : ''}`}>
              {selectedFile ? '✓ File ready to convert' : 'No file selected'}
            </span>
            <button
              className="cp-primary-btn"
              onClick={handleConvert}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing
                ? <><div className="cp-loader" /> Converting...</>
                : <><Sparkles size={16} /> Convert</>}
            </button>
          </div>
        </div>

        {/* ── Output card ── */}
        <div className={`cp-card ${isProcessing ? 'loading' : ''} ${successFlash ? 'success-flash' : ''}`}>
          <div className="cp-card-header">
            <span className="cp-card-title">{currentType.outputLabel}</span>
            {isDone && (
              <button
                className={`cp-btn-text ${copied ? 'success' : ''}`}
                onClick={handleCopyName}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy name'}
              </button>
            )}
          </div>

          <div className="cp-card-body">
            {isProcessing && (
              <div className="cp-loading-state">
                <div className="cp-pulse-icon">
                  <FileText size={48} />
                </div>
                <p className="cp-loading-text">{loadPhrase}</p>
              </div>
            )}

            {!isProcessing && isDone && (
              <div className="cp-success-state">
                <div className="cp-success-icon">
                  <Check size={36} />
                </div>
                <p className="cp-success-title">Conversion Complete!</p>
                <p className="cp-success-sub">{outputFileName}</p>
              </div>
            )}

            {!isProcessing && !isDone && (
              <div className="cp-empty-state">
                <FileText size={64} />
                <p className="cp-empty-text">Output will appear here</p>
              </div>
            )}
          </div>

          <div className="cp-card-footer">
            <span className={`cp-status ${isDone ? 'done' : ''}`}>
              {isDone ? `✓ Ready: ${outputFileName}` : 'Awaiting conversion'}
            </span>
            <button
              className="cp-primary-btn"
              onClick={handleDownload}
              disabled={!isDone}
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default ConvertPDF;