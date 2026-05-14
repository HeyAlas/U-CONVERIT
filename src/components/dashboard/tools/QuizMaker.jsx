import '../../../styles/dashboard.css';
import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LETTERS = ["A", "B", "C", "D"];

// ── SETUP SCREEN ──
function SetupScreen({ onGenerate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch {}
  };

  const handleGenerate = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch(`${API_BASE}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          count,
          user_id: user?.id || null,
          title: title.trim() || null, 
          difficulty: "medium",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate quiz");

      onGenerate(data.questions, data.quiz_id);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qm-container">
      <div className="qm-panel">
        <div className="qm-header">
          <span className="qm-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h.01M9 12h.01M9 15h.01M13 9h3M13 12h3M13 15h3" strokeLinecap="round"/>
            </svg>
            Quiz Maker
          </span>
          <button className="qm-btn-secondary" onClick={handlePaste}>
            Paste Notes
          </button>
        </div>

        <div className="qm-body">
          <div>
            <label className="qm-label" style={{ display: 'block', marginBottom: '6px' }}>
              Quiz Title <span style={{ color: '#888', fontWeight: 'normal', fontSize: '12px' }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Chapter 1: Biology Basics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginBottom: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <textarea
            className="qm-textarea"
            placeholder="Paste your notes, textbook content, or study material here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="qm-row">
            <div>
              <label className="qm-label">Number of questions</label>
              <select
                className="qm-select"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <button
              className="qm-btn-primary"
              onClick={handleGenerate}
              disabled={!content.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="qm-loader" />
                  Generating…
                </>
              ) : (
                "Generate Quiz →"
              )}
            </button>
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>
              ❌ {error}
            </div>
          )}
        </div>

        <div className="qm-footer">
          <span className="qm-status">
            {content.trim() ? `${content.length.toLocaleString()} characters · Ready` : "Enter content to begin"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── QUIZ SCREEN ──
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
    <div className="qm-container">
      <div className="qm-panel">
        <div className="qm-progress-wrap">
          <div className="qm-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="qm-header">
          <span className="qm-title">
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

        <div className="qm-body">
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

        <div className="qm-footer">
          <button
            className="qm-btn-secondary"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            ← Back
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(allRevealed || (isRevealed && current === total - 1)) && (
              <button className="qm-btn-primary" onClick={handleFinish}>
                See Results 🎯
              </button>
            )}
            
            {!isRevealed ? (
              <button className="qm-btn-primary" onClick={handleSubmit} disabled={chosen === null}>
                Submit
              </button>
            ) : current < total - 1 ? (
              <button className="qm-btn-primary" onClick={handleNext}>Next →</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RESULTS SCREEN ──
function ResultsScreen({ results, quizId, durationSeconds, onRetry, onNew }) {
  const correct = results.filter((r) => r.revealed && r.correct).length;
  const wrong = results.filter((r) => r.revealed && !r.correct).length;
  const skipped = results.filter((r) => !r.revealed).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveAttempted = useRef(false);

  const saveAttempt = useCallback(async () => {
    console.log("🎯 saveAttempt called");
    console.log("Quiz ID:", quizId);
    console.log("Save attempted ref:", saveAttempted.current);

    if (saveAttempted.current || !quizId) {
      console.log("⏭️ Skipping save - already attempted or no quiz ID");
      return;
    }
    saveAttempted.current = true;
    setSaving(true);

    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("👤 User:", user?.id);

      if (!user) {
        console.warn("❌ No user logged in. Skipping attempt save.");
        return;
      }

      const answers = results.map((r, i) => ({
        question_index: i,
        chosen: r.chosen,
        correct: r.correct,
        revealed: r.revealed,
      }));

      console.log("📤 Sending to backend:", {
        quiz_id: quizId,
        score: correct,
        total: total,
      });

      const res = await fetch(`${API_BASE}/api/quiz/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          user_id: user.id,
          score: correct,
          total: total,
          answers: answers,
          duration_seconds: durationSeconds || 0,
        }),
      });

      const data = await res.json();
      console.log("📥 Response:", data);

      if (res.ok) {
        console.log("✅ Saved successfully!");
        setSaved(true);
      } else {
        console.error("❌ Save failed:", data);
      }
    } catch (err) {
      console.error("❌ Failed to save attempt:", err);
    } finally {
      setSaving(false);
    }
  }, [quizId, results, correct, total, durationSeconds]);

  useState(() => {
    saveAttempt();
  });

  const headline =
    pct >= 90 ? "🏆 Outstanding!" :
    pct >= 70 ? "🎉 Well done!" :
    pct >= 50 ? "👍 Good effort!" :
    "📚 Keep studying!";

  const scoreColor = pct >= 70 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#8B1515";

  return (
    <div className="qm-container">
      <div className="qm-panel">
        <div className="qm-header">
          <span className="qm-title">Quiz Results</span>
          <span className="qm-status">
            {pct}% score
            {saving && " · Saving..."}
            {saved && " · ✓ Saved"}
          </span>
        </div>

        <div className="qm-body">
          <div className="qm-score-hero">
            <div className="qm-score-circle">
              <span className="qm-score-num">{correct}</span>
              <span className="qm-score-denom">of {total}</span>
            </div>
            <p className="qm-score-headline">{headline}</p>
          </div>

          <div className="qm-score-container">
            <div className="qm-score-meta">
              <span>Score</span>
              <span style={{ color: scoreColor }}>{pct}%</span>
            </div>
            <div className="qm-score-track">
              <div
                className="qm-score-fill"
                style={{
                  width: `${pct}%`,
                  background: scoreColor,
                }}
              />
            </div>
          </div>

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

        <div className="qm-footer">
          <button className="qm-btn-secondary" onClick={onNew}>New Quiz</button>
          <button className="qm-btn-primary" onClick={onRetry}>Retry</button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──
function QuizMaker() {
  const [screen, setScreen] = useState("setup");
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const handleGenerate = useCallback((qs, id) => {
    setQuestions(qs);
    setQuizId(id);
    setStartTime(Date.now());
    setScreen("quiz");
  }, []);

  const handleFinish = useCallback((res) => {
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setDurationSeconds(duration);
    setResults(res);
    setScreen("results");
  }, [startTime]);

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
          quizId={quizId}
          durationSeconds={durationSeconds}
          onRetry={() => {
            setStartTime(Date.now());
            setScreen("quiz");
          }}
          onNew={() => {
            setQuestions([]);
            setResults([]);
            setQuizId(null);
            setScreen("setup");
          }}
        />
      )}
    </div>
  );
}

export default QuizMaker;