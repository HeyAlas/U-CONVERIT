import { useState, useRef, useEffect } from 'react';
import { 
  Clipboard, Trash2, Copy, Check, 
  RefreshCw, Info, AlertCircle 
} from "lucide-react";

import './Paraphraser.css';

const MODES = [
  { id: 'standard', label: 'Standard', desc: 'Balanced rewrite' },
  { id: 'fluency',  label: 'Fluency',  desc: 'Improve flow' },
  { id: 'formal',   label: 'Formal',   desc: 'Professional tone' },
  { id: 'creative', label: 'Creative', desc: 'More expressive' },
  { id: 'shorten',  label: 'Shorten',  desc: 'Concise version' },
];

const LOADING_PHRASES = [
  'Rewriting your text...',
  'Finding better words...',
  'Polishing sentences...',
  'Almost there...',
];

const CHAR_LIMIT = 2000;

export function Paraphraser() {
  const [inputText, setInputText]       = useState('');
  const [outputText, setOutputText]     = useState('');
  const [mode, setMode]                 = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadPhrase, setLoadPhrase]     = useState(LOADING_PHRASES[0]);
  const [copied, setCopied]             = useState(false);
  const inputRef                        = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let interval;
    if (isProcessing) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_PHRASES.length;
        setLoadPhrase(LOADING_PHRASES[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleParaphrase = async () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    setOutputText('');

    /* Replace with your real API call */
    await new Promise(r => setTimeout(r, 2000));
    setOutputText(
      `[${mode.toUpperCase()}] ${inputText
        .split('. ')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('. ')}`
    );

    setIsProcessing(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text.slice(0, CHAR_LIMIT));
      inputRef.current?.focus();
    } catch (error) {
      console.error("Clipboard access denied");
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    inputRef.current?.focus();
  };

  const isOverLimit = inputText.length >= CHAR_LIMIT;

  return (
    <div className="pr-container">
      <header className="pr-top-bar">
        <div className="pr-mode-selector">
          <span className="pr-label"><Info size={14} /> Mode:</span>
          {MODES.map(m => (
            <button
              key={m.id}
              className={`pr-pill ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <main className="pr-main-grid">
        {/* Input Panel */}
        <div className={`pr-card ${isOverLimit ? 'warning' : ''}`}>
          <div className="pr-card-header">
            <span className="pr-card-title">Original Text</span>
            <div className="pr-actions">
              <button onClick={handleClear} className="pr-btn-icon" title="Clear All"><Trash2 size={16}/></button>
              <button onClick={handlePaste} className="pr-btn-text"><Clipboard size={14}/> Paste</button>
            </div>
          </div>
          
          <div className="pr-card-body">
            <textarea
              ref={inputRef}
              placeholder="Type or paste your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, CHAR_LIMIT))}
              maxLength={CHAR_LIMIT}
            />
            {!inputText && <div className="pr-ghost-icon"><RefreshCw size={64} /></div>}
          </div>

          <div className="pr-card-footer">
            <span className={`pr-char-count ${isOverLimit ? 'limit' : ''}`}>
              {isOverLimit && <AlertCircle size={12} />}
              {inputText.length} / {CHAR_LIMIT}
            </span>
            <button 
              className="pr-primary-btn" 
              onClick={handleParaphrase}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? <div className="pr-loader" /> : <RefreshCw size={16} />}
              {isProcessing ? 'Processing...' : 'Paraphrase'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={`pr-card output-card ${isProcessing ? 'loading' : ''}`}>
          <div className="pr-card-header">
            <span className="pr-card-title">Paraphrased Result</span>
            <button 
              onClick={handleCopy} 
              disabled={!outputText || isProcessing}
              className={`pr-btn-text ${copied ? 'success' : ''}`}
            >
              {copied ? <Check size={14}/> : <Copy size={14}/>}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="pr-card-body">
            {isProcessing ? (
              <div className="pr-loading-state">
                <div className="pr-pulse-icon"><RefreshCw size={40} /></div>
                <p className="pr-loading-text">{loadPhrase}</p>
              </div>
            ) : (
              <textarea 
                readOnly 
                value={outputText} 
                placeholder="Paraphrased text will appear here..." 
              />
            )}
          </div>

          <div className="pr-card-footer">
            {outputText && !isProcessing && (
              <span className="pr-char-count">{outputText.length} characters</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Paraphraser;