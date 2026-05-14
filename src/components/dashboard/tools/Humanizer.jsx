import { useState, useRef, useEffect } from 'react';
import { 
  Clipboard, Trash2, Copy, Check, 
  Sparkles, ShieldCheck, Info, TrendingUp
} from "lucide-react";
import '../../../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STRENGTH_LEVELS = [
  { id: 'light',    label: 'Light',    desc: 'Subtle touch-ups' },
  { id: 'balanced', label: 'Balanced', desc: 'Natural rewrite' },
  { id: 'strong',   label: 'Strong',   desc: 'Full humanization' },
];

const LOADING_PHRASES = [
  'Adding a personal touch...',
  'Warming up the words...',
  'Breathing life into text...',
  'Removing the robot vibes...',
];

const CHAR_LIMIT = 100000;

function Humanizer() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [strength, setStrength] = useState('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadPhrase, setLoadPhrase] = useState(LOADING_PHRASES[0]);
  const [copied, setCopied] = useState(false);
  const [humanScore, setHumanScore] = useState(null);
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

  // Word count helper
  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Character count color helper
  const getCharCountClass = () => {
    const len = inputText.length;
    if (len > CHAR_LIMIT * 0.95) return 'hm-char-count danger';
    if (len > CHAR_LIMIT * 0.8) return 'hm-char-count warning';
    return 'hm-char-count';
  };

  const handleHumanize = async () => {
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setHumanScore(null);
    setSuccessFlash(false);
    setOutputText('');

    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(`${API_BASE}/api/humanize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          strength: strength,
          user_id: user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to humanize text');
      }

      setOutputText(data.result);
      setHumanScore(data.human_score);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 600);

    } catch (err) {
      console.error('Humanize error:', err);
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
    setHumanScore(null);
    inputRef.current?.focus();
  };

  // Keyboard shortcut: Ctrl+Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleHumanize();
    }
  };

  // Score color logic
  const getScoreColors = () => {
    if (!humanScore) return { dark: '#16a34a', light: '#22c55e' };
    if (humanScore >= 95) return { dark: '#16a34a', light: '#22c55e' }; // Green
    if (humanScore >= 90) return { dark: '#65a30d', light: '#84cc16' }; // Lime
    if (humanScore >= 85) return { dark: '#ca8a04', light: '#eab308' }; // Yellow
    return { dark: '#dc2626', light: '#ef4444' }; // Red
  };

  const scoreColors = getScoreColors();

  return (
    <div className="hm-container">
      <header className="hm-top-bar">
        <div className="hm-strength-selector">
          <span className="hm-label"><Info size={14} /> Intensity:</span>
          {STRENGTH_LEVELS.map(s => (
            <button
              key={s.id}
              className={`hm-pill ${strength === s.id ? 'active' : ''}`}
              onClick={() => setStrength(s.id)}
              title={s.desc}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className="hm-main-grid">
        {/* Input Panel */}
        <div className="hm-card">
          <div className="hm-card-header">
            <span className="hm-card-title">AI-Generated Content</span>
            <div className="hm-actions">
              <button onClick={handleClear} className="hm-btn-icon" title="Clear All">
                <Trash2 size={16}/>
              </button>
              <button onClick={handlePaste} className="hm-btn-text">
                <Clipboard size={14}/> Paste
              </button>
            </div>
          </div>
          
          <div className="hm-card-body">
            <textarea
              ref={inputRef}
              placeholder="Paste your AI-generated text here... (Ctrl+Enter to humanize)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={CHAR_LIMIT}
            />
            {!inputText && (
              <div className="hm-ghost-icon">
                <ShieldCheck size={64} />
              </div>
            )}
          </div>

          <div className="hm-card-footer">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className={getCharCountClass()}>
                {inputText.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()} chars
              </span>
              {inputText && (
                <span className="hm-word-count">
                  {getWordCount(inputText)} words
                </span>
              )}
            </div>
            <button 
              className="hm-primary-btn" 
              onClick={handleHumanize}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? <div className="hm-loader" /> : <Sparkles size={16} />}
              {isProcessing ? 'Processing...' : 'Humanize Text'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={`hm-card output-card ${isProcessing ? 'loading' : ''} ${successFlash ? 'success-flash' : ''}`}>
          <div className="hm-card-header">
            <span className="hm-card-title">Humanized Result</span>
            <button 
              onClick={handleCopy} 
              disabled={!outputText || isProcessing}
              className={`hm-btn-text ${copied ? 'success' : ''}`}
            >
              {copied ? <Check size={14}/> : <Copy size={14}/>}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="hm-card-body">
            {isProcessing ? (
              <div className="hm-loading-state">
                <div className="hm-pulse-heart"><Sparkles size={40} /></div>
                <p className="hm-loading-text">{loadPhrase}</p>
              </div>
            ) : (
              <>
                <textarea 
                  readOnly 
                  value={outputText} 
                  placeholder="Humanized text will appear here..." 
                />
                {!outputText && !isProcessing && (
                  <div className="hm-ghost-icon">
                    <Sparkles size={64} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hm-card-footer">
            {humanScore && !isProcessing && (
              <div 
                className="hm-score-container animate-in"
                style={{ '--score-color': scoreColors.dark, '--score-color-light': scoreColors.light }}
              >
                <div className="hm-score-meta">
                  <span className="hm-score-meta-label">
                    <TrendingUp size={14} />
                    Human Probability Score
                  </span>
                  <span className="hm-score-value" style={{color: scoreColors.dark}}>
                    {humanScore}%
                  </span>
                </div>
                <div className="hm-score-track">
                  <div className="hm-score-fill" style={{width: `${humanScore}%`}} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Humanizer;