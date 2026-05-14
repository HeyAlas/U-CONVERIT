import { useState, useRef, useEffect } from 'react';
import { 
  Clipboard, Trash2, Copy, Check, 
  RefreshCw, Info, Sparkles
} from "lucide-react";
import '../../../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

const CHAR_LIMIT = 100000;

function Paraphraser() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadPhrase, setLoadPhrase] = useState(LOADING_PHRASES[0]);
  const [copied, setCopied] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const inputRef = useRef(null);

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

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getCharCountClass = () => {
    const len = inputText.length;
    if (len > CHAR_LIMIT * 0.95) return 'pr-char-count danger';
    if (len > CHAR_LIMIT * 0.8) return 'pr-char-count warning';
    return 'pr-char-count';
  };

  const handleParaphrase = async () => {
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setOutputText('');
    setSuccessFlash(false);

    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(`${API_BASE}/api/paraphrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          mode: mode,
          user_id: user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to paraphrase text');
      }

      setOutputText(data.result);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 600);

    } catch (err) {
      console.error('Paraphrase error:', err);
      setOutputText(`❌ Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleParaphrase();
    }
  };

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
        <div className="pr-card">
          <div className="pr-card-header">
            <span className="pr-card-title">Original Text</span>
            <div className="pr-actions">
              <button onClick={handleClear} className="pr-btn-icon" title="Clear All">
                <Trash2 size={16}/>
              </button>
              <button onClick={handlePaste} className="pr-btn-text">
                <Clipboard size={14}/> Paste
              </button>
            </div>
          </div>
          
          <div className="pr-card-body">
            <textarea
              ref={inputRef}
              placeholder="Type or paste your text here... (Ctrl+Enter to paraphrase)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={CHAR_LIMIT}
            />
            {!inputText && (
              <div className="pr-ghost-icon">
                <Sparkles size={64} />
              </div>
            )}
          </div>

          <div className="pr-card-footer">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className={getCharCountClass()}>
                {inputText.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()} chars
              </span>
              {inputText && (
                <span className="pr-word-count">
                  {getWordCount(inputText)} words
                </span>
              )}
            </div>
            <button 
              className="pr-primary-btn" 
              onClick={handleParaphrase}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? <div className="pr-loader" /> : <Sparkles size={16} />}
              {isProcessing ? 'Processing...' : 'Paraphrase'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={`pr-card output-card ${isProcessing ? 'loading' : ''} ${successFlash ? 'success-flash' : ''}`}>
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
              <>
                <textarea 
                  readOnly 
                  value={outputText} 
                  placeholder="Paraphrased text will appear here..." 
                />
                {!outputText && !isProcessing && (
                  <div className="pr-ghost-icon">
                    <RefreshCw size={64} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pr-card-footer">
            {outputText && !isProcessing && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className="pr-char-count">
                  {outputText.length.toLocaleString()} chars
                </span>
                <span className="pr-word-count">
                  {getWordCount(outputText)} words
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Paraphraser;