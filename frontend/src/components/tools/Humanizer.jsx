import { useState, useRef, useEffect } from 'react';
import { 
  Clipboard, Trash2, Copy, Check, 
  Sparkles, ShieldCheck, Info, AlertCircle 
} from "lucide-react";
import './Humanizer.css';

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

const CHAR_LIMIT = 2000;

export function Humanizer() {
  const [inputText, setInputText]       = useState('');
  const [outputText, setOutputText]     = useState('');
  const [strength, setStrength]         = useState('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadPhrase, setLoadPhrase]     = useState(LOADING_PHRASES[0]);
  const [copied, setCopied]             = useState(false);
  const [humanScore, setHumanScore]     = useState(null);
  const inputRef                        = useRef(null);

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

  const handleHumanize = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setHumanScore(null);

    setTimeout(() => {
      setOutputText(`[${strength.toUpperCase()} MODE] This version of your text has been rewritten to bypass AI detection while maintaining your core message...`);
      setHumanScore(Math.floor(Math.random() * (99 - 88 + 1) + 88));
      setIsProcessing(false);
    }, 3000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text.slice(0, CHAR_LIMIT));
    } catch (error) {
      console.error("Clipboard access denied");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOverLimit = inputText.length >= CHAR_LIMIT;
  const scoreColor = humanScore >= 90 ? '#16a34a' : '#ca8a04';

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
        <div className={`hm-card ${isOverLimit ? 'warning' : ''}`}>
          <div className="hm-card-header">
            <span className="hm-card-title">AI-Generated Content</span>
            <div className="hm-actions">
              <button onClick={() => setInputText('')} className="hm-btn-icon" title="Clear All"><Trash2 size={16}/></button>
              <button onClick={handlePaste} className="hm-btn-text"><Clipboard size={14}/> Paste</button>
            </div>
          </div>
          
          <div className="hm-card-body">
            <textarea
              ref={inputRef}
              placeholder="Paste your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={CHAR_LIMIT}
            />
            {!inputText && <div className="hm-ghost-icon"><ShieldCheck size={64} /></div>}
          </div>

          <div className="hm-card-footer">
            <span className={`hm-char-count ${isOverLimit ? 'limit' : ''}`}>
              {isOverLimit && <AlertCircle size={12} />}
              {inputText.length} / {CHAR_LIMIT}
            </span>
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
        <div className={`hm-card output-card ${isProcessing ? 'loading' : ''}`}>
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
              <textarea 
                readOnly 
                value={outputText} 
                placeholder="Result will appear here..." 
              />
            )}
          </div>

          <div className="hm-card-footer">
            {humanScore && !isProcessing && (
              <div className="hm-score-container animate-in">
                <div className="hm-score-meta">
                  <span>Human Probability Score</span>
                  <span style={{color: scoreColor, fontWeight: '700'}}>{humanScore}%</span>
                </div>
                <div className="hm-score-track">
                  <div className="hm-score-fill" style={{width: `${humanScore}%`, background: scoreColor}} />
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