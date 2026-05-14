import { useState, useRef } from 'react';
import { 
  Upload, Copy, Check, Image as ImageIcon, 
  FileText, X, AlertCircle, Sparkles 
} from "lucide-react";
import '../../../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function OCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [successFlash, setSuccessFlash] = useState(false);

  const fileInputRef = useRef(null);

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setSelectedFile(file);
    setOutputText('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    setOutputText('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setOutputText('');
    setError('');
    setSuccessFlash(false);

    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (user?.id) {
        formData.append('user_id', user.id);
      }

      const response = await fetch(`${API_BASE}/api/ocr`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to extract text');
      }

      setOutputText(data.text);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 600);

    } catch (err) {
      console.error('OCR error:', err);
      setError(`❌ ${err.message}`);
      setOutputText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ocr-root">
      <div className="ocr-top-bar">
        <div className="ocr-info-banner">
          <Sparkles size={16} />
          <span>Upload an image to extract text. Supports PNG, JPG, WEBP. Powered by OCR.space</span>
        </div>
      </div>

      <div className="ocr-container">

        <div className="ocr-panel">
          <div className="ocr-header">
            <span className="ocr-title">
              <ImageIcon size={18} /> Upload Image
            </span>
          </div>

          <div className="ocr-body">
            <div
              className={`ocr-upload-area ${preview ? 'has-file' : ''} ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />

              {!preview ? (
                <div className="ocr-upload-content">
                  <Upload size={48} className="ocr-upload-icon" />
                  <p className="ocr-upload-text">
                    {isDragging ? 'Drop image here!' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="ocr-upload-hint">PNG, JPG, WEBP — Max 5MB</p>
                </div>
              ) : (
                <div className="ocr-upload-content">
                  <button 
                    className="ocr-remove-btn" 
                    onClick={handleRemoveFile}
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                  <span className="ocr-file-name">
                    <FileText size={14} />
                    {selectedFile?.name}
                  </span>
                  <img src={preview} className="ocr-image-preview" alt="Preview" />
                </div>
              )}
            </div>

            {error && (
              <div className="ocr-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          <div className="ocr-footer">
            <span className={`ocr-status ${selectedFile ? 'ready' : ''}`}>
              {selectedFile 
                ? `${(selectedFile.size / 1024).toFixed(1)} KB - Ready to extract` 
                : 'No file selected'}
            </span>
            <button
              className="ocr-btn-primary"
              onClick={handleExtract}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? <div className="ocr-loader" /> : <Sparkles size={16} />}
              {isProcessing ? 'Extracting...' : 'Extract Text'}
            </button>
          </div>
        </div>

        <div className={`ocr-panel ${isProcessing ? 'loading' : ''} ${successFlash ? 'success-flash' : ''}`}>
          <div className="ocr-header">
            <span className="ocr-title">
              <FileText size={18} /> Extracted Text
            </span>

            <button
              className={`ocr-btn-secondary ${copied ? 'success' : ''}`}
              onClick={handleCopy}
              disabled={!outputText}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? ' Copied!' : ' Copy'}
            </button>
          </div>

          <div className="ocr-body">
            {isProcessing ? (
              <div className="ocr-loading-state">
                <ImageIcon size={48} className="ocr-loading-icon" />
                <p className="ocr-loading-text">Reading your image...</p>
              </div>
            ) : (
              <textarea
                className="ocr-textarea"
                value={outputText}
                readOnly
                placeholder="Extracted text will appear here..."
              />
            )}
          </div>

          <div className="ocr-footer">
            {outputText && !isProcessing ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className="ocr-status">
                  {outputText.length.toLocaleString()} chars
                </span>
                <span className="ocr-word-count">
                  {getWordCount(outputText)} words
                </span>
              </div>
            ) : (
              <span className="ocr-status">Awaiting extraction</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default OCR;