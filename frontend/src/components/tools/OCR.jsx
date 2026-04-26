import { useState, useRef } from 'react';
import { Upload, Copy, Check, Image } from "lucide-react";
import './Humanizer.css';

const OCR_API_KEY = "K84088987388957";

export function OCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  // ✅ DRAG & DROP
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  // ✅ FILE HANDLER (FIXED - no duplicates)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ✅ OCR SPACE INTEGRATION
  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setOutputText('');

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: OCR_API_KEY,
        },
        body: formData,
      });

      const data = await response.json();

      const text =
        data?.ParsedResults?.[0]?.ParsedText || "No text found.";

      setOutputText(text);
    } catch (err) {
      setOutputText("Error connecting to OCR API.");
    }

    setIsProcessing(false);
  };

  // ✅ COPY
  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hm-container">

      {/* TOP BAR */}
      <header className="hm-top-bar">
        <div className="hm-strength-selector">
          <span className="hm-label">
            <Image size={14} /> OCR Tool
          </span>
        </div>
      </header>

      <main className="hm-main-grid">

        {/* INPUT CARD */}
        <div className="hm-card">

          <div className="hm-card-header">
            <span className="hm-card-title">Upload Image</span>
          </div>

          <div
            className="upload-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />

            <div className="upload-content">
              <Upload size={34} className="upload-icon" />

              {!preview ? (
                <>
                  <p className="upload-text">Drag & drop or click</p>
                  <p className="upload-hint">PNG, JPG, WEBP</p>
                </>
              ) : (
                <>
                  <p className="file-name">{selectedFile?.name}</p>
                  <img src={preview} className="image-preview" />
                </>
              )}
            </div>
          </div>

          <div className="hm-card-footer">
            <span className="hm-char-count">
              {selectedFile ? "Ready" : "No file selected"}
            </span>

            <button
              className="hm-primary-btn"
              onClick={handleExtract}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? "Extracting..." : "Extract Text"}
            </button>
          </div>
        </div>

        {/* OUTPUT CARD */}
        <div className={`hm-card ${isProcessing ? 'loading' : ''}`}>

          <div className="hm-card-header">
            <span className="hm-card-title">Extracted Text</span>

            <button
              className="hm-btn-text"
              onClick={handleCopy}
              disabled={!outputText}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="hm-card-body">
            {isProcessing ? (
              <div className="hm-loading-state">
                <Image size={40} />
                <p className="hm-loading-text">Reading image...</p>
              </div>
            ) : (
              <textarea
                className="tool-textarea"
                value={outputText}
                readOnly
                placeholder="OCR output appears here..."
              />
            )}
          </div>

          <div className="hm-card-footer">
            <span className="hm-char-count">
              {outputText.length} chars
            </span>
          </div>

        </div>

      </main>
    </div>
  );
}