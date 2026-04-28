import { useState, useRef } from 'react';
import { Upload, FileText, Download, Copy, Check, ArrowRight, Info } from 'lucide-react';
import './ConvertPDF.css';

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

export function ConvertPDF() {
  const [convertType, setConvertType]       = useState('pdf-to-word');
  const [selectedFile, setSelectedFile]     = useState(null);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [isDone, setIsDone]                 = useState(false);
  const [loadPhrase, setLoadPhrase]         = useState(LOADING_PHRASES[0]);
  const [copied, setCopied]                 = useState(false);
  const [outputFileName, setOutputFileName] = useState('');

  const fileInputRef   = useRef(null);
  const phraseInterval = useRef(null);

  const currentType = CONVERSION_TYPES.find(t => t.id === convertType);

  const resetOutput = () => {
    setIsDone(false);
    setOutputFileName('');
  };

  const handleTypeChange = (id) => {
    setConvertType(id);
    setSelectedFile(null);
    resetOutput();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    resetOutput();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleClear = () => {
    setSelectedFile(null);
    resetOutput();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleConvert = () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setIsDone(false);

    let i = 0;
    phraseInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadPhrase(LOADING_PHRASES[i]);
    }, 1200);

    // Replace this timeout with your real API call
    setTimeout(() => {
      clearInterval(phraseInterval.current);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setOutputFileName(`${baseName}${currentType.outputExt}`);
      setIsProcessing(false);
      setIsDone(true);
    }, 3000);
  };

  const handleDownload = () => {
    // Replace with real blob / presigned URL from your backend
    const blob = new Blob([`Converted: ${selectedFile?.name}`], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
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
            <span className="cp-card-title">{currentType.inputLabel}</span>
            {selectedFile && (
              <button className="cp-btn-text" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>

          <div className="cp-card-body">
            <div
              className={`cp-upload-area ${selectedFile ? 'has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current.click()}
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
                  <Upload size={38} className="cp-upload-icon" />
                  <p className="cp-upload-text">Drag &amp; drop or click to upload</p>
                  <p className="cp-upload-hint">Accepted: {currentType.hint}</p>
                </>
              ) : (
                <>
                  <FileText size={38} className="cp-upload-icon" />
                  <p className="cp-file-name">{selectedFile.name}</p>
                  <p className="cp-file-size">{formatFileSize(selectedFile.size)}</p>
                </>
              )}
            </div>
          </div>

          <div className="cp-card-footer">
            <span className="cp-status">
              {selectedFile ? 'File ready' : 'No file selected'}
            </span>
            <button
              className="cp-primary-btn"
              onClick={handleConvert}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing
                ? <><div className="cp-loader" /> Converting...</>
                : <><ArrowRight size={16} /> Convert</>}
            </button>
          </div>
        </div>

        {/* ── Output card ── */}
        <div className={`cp-card ${isProcessing ? 'loading' : ''}`}>
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
                  <FileText size={40} />
                </div>
                <p className="cp-loading-text">{loadPhrase}</p>
              </div>
            )}

            {!isProcessing && isDone && (
              <div className="cp-success-state">
                <div className="cp-success-icon">
                  <Check size={32} />
                </div>
                <p className="cp-success-title">Conversion Complete!</p>
                <p className="cp-success-sub">{outputFileName}</p>
              </div>
            )}

            {!isProcessing && !isDone && (
              <div className="cp-empty-state">
                <FileText size={56} />
                <p className="cp-empty-text">Output will appear here</p>
              </div>
            )}
          </div>

          <div className="cp-card-footer">
            <span className="cp-status">
              {isDone ? `Ready: ${outputFileName}` : 'Awaiting conversion'}
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