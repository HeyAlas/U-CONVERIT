import { useState, useRef } from 'react';
import { Upload, Copy, Check, Image } from "lucide-react";
import './OCR.css';

const OCR_API_KEY = "K84088987388957";

export function OCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => e.preventDefault();

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
        headers: { apikey: OCR_API_KEY },
        body: formData,
      });

      const data = await response.json();
      const text = data?.ParsedResults?.[0]?.ParsedText || "No text found.";
      setOutputText(text);
    } catch (err) {
      setOutputText("Error connecting to OCR API.");
    }

    setIsProcessing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ocr-root">
      <div className="tool-container">

        {/* LEFT PANEL */}
        <div className="tool-panel">
          <div className="panel-header">
            <span className="panel-title">
              <Image size={18} /> Upload Image
            </span>
            <span className="btn-secondary">∞ Unlimited</span>
          </div>

          {/* ✅ FIXED: wrapped in panel-body */}
          <div className="panel-body">
            <div
              className={`upload-area ${preview ? 'has-file' : ''}`}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }} // Added inline fix
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
                    <p className="upload-text">Click to upload or drag & drop</p>
                    <p className="upload-hint">PNG, JPG, WEBP — any size with Pro</p>
                  </>
                ) : (
                  <>
                    <p className="file-name">{selectedFile?.name}</p>
                    <img src={preview} className="image-preview" alt="Preview" />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="panel-footer">
            <span className="file-status">
              {selectedFile ? 'Ready to extract' : 'No file selected'}
            </span>
            <button
              className="btn-primary"
              onClick={handleExtract}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? 'Extracting...' : 'Extract Text'}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="tool-panel">
          <div className="panel-header">
            <span className="panel-title">
              <Image size={18} /> Extracted Text
            </span>

            <button
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!outputText}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? ' Copied' : ' Copy'}
            </button>
          </div>

          <div className="panel-body">
            {isProcessing ? (
              <div className="upload-content">
                <Image size={40} className="upload-icon" />
                <p className="upload-text">Reading image...</p>
              </div>
            ) : (
              <textarea
                className="tool-textarea"
                value={outputText}
                readOnly
                placeholder="Extracted text will appear here..."
              />
            )}
          </div>

          <div className="panel-footer">
            <span className="file-status">{outputText.length} chars</span>
          </div>
        </div>

      </div>
    </div>
  );
}