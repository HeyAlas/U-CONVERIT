import { useState, useCallback } from "react";
import "./QuizMaker.css";

const LETTERS = ["A", "B", "C", "D"];

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
function generateMockQuiz(content, count) {
  return Array.from({ length: count }).map((_, i) => ({
    question: `Sample Question ${i + 1}: What is the main idea from your content?`,
    choices: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: Math.floor(Math.random() * 4),
  }));
}

// ── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({ onGenerate }) {
  const [content, setContent] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch {}
  };

  const handleGenerate = () => {
    if (!content.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onGenerate(generateMockQuiz(content, count));
      setLoading(false);
    }, 600);
  };

  return (
    <div className="tool-container">
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={16} height={16}>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h.01M9 12h.01M9 15h.01M13 9h3M13 12h3M13 15h3" strokeLinecap="round"/>
            </svg>
            Quiz Maker
          </span>
          <div className="panel-actions">
            <button className="btn-secondary" onClick={handlePaste}>Paste Notes</button>
          </div>
        </div>

        <div className="panel-body">
          <textarea
            className="tool-textarea qm-setup-textarea"
            placeholder="Paste your notes, textbook content, or study material here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="panel-row">
            <div>
              <label className="question-label">Number of questions</label>
              <select
                className="select-input"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!content.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="hm-loader" />
                  Generating…
                </>
              ) : (
                "Generate Quiz →"
              )}
            </button>
          </div>
        </div>

        <div className="panel-footer">
          <span className="file-status">
            {content.trim() ? `${content.length} characters · Ready` : "Enter content to begin"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── QUIZ SCREEN ───────────────────────────────────────────────────────────────
function QuizScreen({ questions, onFinish }) {
  const total = questions.length;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  const q = questions[current];
  const isRevealed = !!revealed[current];
  const chosen = answers[current] ?? null;

  const handleChoose = (idx) => {
    if (isRevealed) return;
    setAnswers((a) => ({ ...a, [current]: idx }));
  };

  const handleSubmit = () => {
    if (chosen === null) return;
    setRevealed((r) => ({ ...r, [current]: true }));
  };

  const handleNext = () => {
    if (current < total - 1) setCurrent((c) => c + 1);
  };

  const handleFinish = () => {
    const res = questions.map((q, i) => ({
      ...q,
      chosen: answers[i] ?? null,
      correct: answers[i] === q.correctIndex,
      revealed: !!revealed[i],
    }));
    onFinish(res);
  };

  const dotStatus = (i) => {
    if (i === current) return "qm-dot-current";
    if (!revealed[i]) return answers[i] !== undefined ? "qm-dot-skipped" : "";
    return answers[i] === questions[i].correctIndex ? "qm-dot-correct" : "qm-dot-wrong";
  };

  const allRevealed = Object.keys(revealed).length === total;
  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div className="tool-container">
      <div className="tool-panel">
        {/* Progress bar */}
        <div className="qm-progress-wrap">
          <div className="qm-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Header */}
        <div className="panel-header">
          <span className="panel-title">
            Question {current + 1}
            <span className="qm-counter-total"> / {total}</span>
          </span>
          <div className="qm-nav-dots">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`qm-dot ${dotStatus(i)}`}
                onClick={() => setCurrent(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="panel-body">
          <p className="qm-question-text">{q.question}</p>

          <div className="qm-choices">
            {q.choices.map((choice, idx) => {
              let cls = "qm-choice";
              if (isRevealed) {
                if (idx === q.correctIndex) cls += " correct";
                else if (idx === chosen) cls += " wrong";
                else cls += " dimmed";
              } else if (chosen === idx) {
                cls += " selected";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleChoose(idx)}
                  disabled={isRevealed}
                >
                  <span className="qm-choice-letter">{LETTERS[idx]}</span>
                  {choice}
                </button>
              );
            })}
          </div>

          {isRevealed && (
            <div className={`qm-feedback ${chosen === q.correctIndex ? "qm-feedback-correct" : "qm-feedback-wrong"}`}>
              {chosen === q.correctIndex
                ? "✓ Correct!"
                : `✗ Incorrect — correct answer: ${LETTERS[q.correctIndex]}: ${q.choices[q.correctIndex]}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="panel-footer">
          <button
            className="btn-secondary"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            ← Back
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {allRevealed && (
              <button className="btn-secondary" onClick={handleFinish}>See Results</button>
            )}
            {!isRevealed ? (
              <button className="btn-primary" onClick={handleSubmit} disabled={chosen === null}>
                Submit
              </button>
            ) : current < total - 1 ? (
              <button className="btn-primary" onClick={handleNext}>Next →</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RESULTS SCREEN ────────────────────────────────────────────────────────────
function ResultsScreen({ results, onRetry, onNew }) {
  const correct = results.filter((r) => r.revealed && r.correct).length;
  const wrong = results.filter((r) => r.revealed && !r.correct).length;
  const skipped = results.filter((r) => !r.revealed).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);

  const headline =
    pct >= 90 ? "Outstanding!" :
    pct >= 70 ? "Well done!" :
    pct >= 50 ? "Good effort!" :
    "Keep studying!";

  return (
    <div className="tool-container">
      <div className="tool-panel">
        <div className="panel-header">
          <span className="panel-title">Quiz Results</span>
          <span className="file-status">{pct}% score</span>
        </div>

        <div className="panel-body">
          {/* Score hero */}
          <div className="qm-score-hero">
            <div className="qm-score-circle">
              <span className="qm-score-num">{correct}</span>
              <span className="qm-score-denom">of {total}</span>
            </div>
            <p className="qm-score-headline">{headline}</p>
          </div>

          {/* Progress bar — reuses OCR.css classes */}
          <div className="score-container animate-in">
            <div className="score-meta">
              <span>Score</span>
              <span>{pct}%</span>
            </div>
            <div className="score-track">
              <div
                className="score-fill"
                style={{
                  width: `${pct}%`,
                  background: pct >= 70 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#8B1515",
                }}
              />
            </div>
          </div>

          {/* Stat breakdown */}
          <div className="qm-breakdown">
            <div className="qm-stat qm-stat-correct">
              <span className="qm-stat-num">{correct}</span>
              <span className="qm-stat-label">Correct</span>
            </div>
            <div className="qm-stat qm-stat-wrong">
              <span className="qm-stat-num">{wrong}</span>
              <span className="qm-stat-label">Wrong</span>
            </div>
            <div className="qm-stat qm-stat-skip">
              <span className="qm-stat-num">{skipped}</span>
              <span className="qm-stat-label">Skipped</span>
            </div>
          </div>

          {/* Review list */}
          <div className="qm-review">
            {results.map((r, i) => {
              const status = !r.revealed ? "skip" : r.correct ? "correct" : "wrong";
              return (
                <div key={i} className={`qm-review-item qm-review-${status}`}>
                  <span className="qm-review-num">{i + 1}</span>
                  <div>
                    <p className="qm-review-q">{r.question}</p>
                    <span className="qm-review-ans">
                      {status === "skip"
                        ? "Not answered"
                        : status === "correct"
                        ? `${LETTERS[r.chosen]}: ${r.choices[r.chosen]}`
                        : `Your: ${LETTERS[r.chosen]}: ${r.choices[r.chosen]} — Correct: ${LETTERS[r.correctIndex]}: ${r.choices[r.correctIndex]}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel-footer">
          <button className="btn-secondary" onClick={onNew}>New Quiz</button>
          <button className="btn-primary" onClick={onRetry}>Retry</button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
// Both named + default export so Dashboard's { QuizMaker } import works
export function QuizMaker() {
  const [screen, setScreen] = useState("setup");
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);

  const handleGenerate = useCallback((qs) => {
    setQuestions(qs);
    setScreen("quiz");
  }, []);

  const handleFinish = useCallback((res) => {
    setResults(res);
    setScreen("results");
  }, []);

  return (
    <div className="qm-wrapper">
      {screen === "setup" && <SetupScreen onGenerate={handleGenerate} />}
      {screen === "quiz" && (
        <QuizScreen
          key={JSON.stringify(questions)}
          questions={questions}
          onFinish={handleFinish}
        />
      )}
      {screen === "results" && (
        <ResultsScreen
          results={results}
          onRetry={() => setScreen("quiz")}
          onNew={() => { setQuestions([]); setResults([]); setScreen("setup"); }}
        />
      )}
    </div>
  );
}

export default QuizMaker;