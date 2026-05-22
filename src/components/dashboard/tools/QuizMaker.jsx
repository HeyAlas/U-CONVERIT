import '../../../styles/dashboard.css';
import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LETTERS = ["A", "B", "C", "D"];

// ── SETUP SCREEN ──
function SetupScreen({ onGenerate }) {
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [count, setCount]       = useState(5);
  const [difficulty, setDifficulty] = useState("medium"); // ← NEW
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

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
          difficulty,           // ← send selected difficulty
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate quiz");

      onGenerate(data.questions, data.quiz_id, data.difficulty);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Difficulty options config for rendering
  const DIFFICULTIES = [
    {
      value: "easy",
      label: "Easy",
      description: "Key terms & definitions",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
    {
      value: "medium",
      label: "Medium",
      description: "Concepts & relationships",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
    },
    {
      value: "hard",
      label: "Hard",
      description: "Analysis & evaluation",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
    },
  ];

  return (
    <div className="qm-container">
      <div className="qm-panel">
        <div className="qm-header">
          <span className="qm-title">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              width={18}
              height={18}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path
                d="M9 9h.01M9 12h.01M9 15h.01M13 9h3M13 12h3M13 15h3"
                strokeLinecap="round"
              />
            </svg>
            Quiz Maker
          </span>
          <button className="qm-btn-secondary" onClick={handlePaste}>
            Paste Notes
          </button>
        </div>

        <div className="qm-body">
          {/* ── Title ── */}
          <div>
            <label
              className="qm-label"
              style={{ display: "block", marginBottom: "6px" }}
            >
              Quiz Title{" "}
              <span
                style={{
                  color: "#888",
                  fontWeight: "normal",
                  fontSize: "12px",
                }}
              >
                (Optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g., Chapter 1: Biology Basics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                marginBottom: "16px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* ── Content ── */}
          <textarea
            className="qm-textarea"
            placeholder="Paste your notes, textbook content, or study material here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* ── Difficulty Selector ── */}
          <div style={{ marginBottom: "16px" }}>
            <label
              className="qm-label"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Difficulty
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: "8px",
                    border: `2px solid ${
                      difficulty === d.value ? d.color : "#e5e7eb"
                    }`,
                    background: difficulty === d.value ? d.bg : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: difficulty === d.value ? d.color : "#374151",
                    }}
                  >
                    {d.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: difficulty === d.value ? d.color : "#9ca3af",
                      marginTop: "2px",
                    }}
                  >
                    {d.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Count + Generate ── */}
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
            <div
              style={{
                color: "#dc2626",
                fontSize: "13px",
                marginTop: "8px",
              }}
            >
              ❌ {error}
            </div>
          )}
        </div>

        <div className="qm-footer">
          <span className="qm-status">
            {content.trim()
              ? `${content.length.toLocaleString()} characters · Ready`
              : "Enter content to begin"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── QUIZ SCREEN ──
// ── QUIZ SCREEN ──
function QuizScreen({ questions, difficulty, onFinish }) {
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
    if (!revealed[i])
      return answers[i] !== undefined ? "qm-dot-skipped" : "";
    return answers[i] === questions[i].correctIndex
      ? "qm-dot-correct"
      : "qm-dot-wrong";
  };

  const allRevealed = Object.keys(revealed).length === total;
  const pct = Math.round(((current + 1) / total) * 100);

  // Difficulty badge styling
  const DIFF_STYLES = {
    easy:   { color: "#16a34a", bg: "#f0fdf4" },
    medium: { color: "#d97706", bg: "#fffbeb" },
    hard:   { color: "#dc2626", bg: "#fef2f2" },
  };
  const diffStyle = DIFF_STYLES[difficulty] || DIFF_STYLES.medium;

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

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Difficulty badge */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "999px",
                color: diffStyle.color,
                background: diffStyle.bg,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {difficulty}
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
            <div
              className={`qm-feedback ${
                chosen === q.correctIndex
                  ? "qm-feedback-correct"
                  : "qm-feedback-wrong"
              }`}
            >
              {chosen === q.correctIndex
                ? "✓ Correct!"
                : `✗ Incorrect — correct answer: ${LETTERS[q.correctIndex]}: ${
                    q.choices[q.correctIndex]
                  }`}
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
              <button
                className="qm-btn-primary"
                onClick={handleSubmit}
                disabled={chosen === null}
              >
                Submit
              </button>
            ) : current < total - 1 ? (
              <button className="qm-btn-primary" onClick={handleNext}>
                Next →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RESULTS SCREEN ──
function ResultsScreen({ results, quizId, difficulty, durationSeconds, onRetry, onNew }) {
  // ... all existing state/logic unchanged ...

  const DIFF_STYLES = {
    easy:   { color: "#16a34a", bg: "#f0fdf4", label: "Easy" },
    medium: { color: "#d97706", bg: "#fffbeb", label: "Medium" },
    hard:   { color: "#dc2626", bg: "#fef2f2", label: "Hard" },
  };
  const diffStyle = DIFF_STYLES[difficulty] || DIFF_STYLES.medium;

  return (
    <div className="qm-container">
      <div className="qm-panel">
        <div className="qm-header">
          <span className="qm-title">Quiz Results</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Difficulty badge */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "999px",
                color: diffStyle.color,
                background: diffStyle.bg,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {diffStyle.label}
            </span>
            <span className="qm-status">
              {pct}% score
              {saving && " · Saving..."}
              {saved && " · ✓ Saved"}
            </span>
          </div>
        </div>
        {/* ... rest unchanged ... */}
      </div>
    </div>
  );
}

// ── ROOT ──
function QuizMaker() {
  const [screen, setScreen]               = useState("setup");
  const [questions, setQuestions]         = useState([]);
  const [results, setResults]             = useState([]);
  const [quizId, setQuizId]               = useState(null);
  const [difficulty, setDifficulty]       = useState("medium"); // ← NEW
  const [startTime, setStartTime]         = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // onGenerate now receives difficulty from the API response
  const handleGenerate = useCallback((qs, id, diff) => {
    setQuestions(qs);
    setQuizId(id);
    setDifficulty(diff || "medium");
    setStartTime(Date.now());
    setScreen("quiz");
  }, []);

  const handleFinish = useCallback((res) => {
    const duration = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;
    setDurationSeconds(duration);
    setResults(res);
    setScreen("results");
  }, [startTime]);

  return (
    <div className="qm-wrapper">
      {screen === "setup" && (
        <SetupScreen onGenerate={handleGenerate} />
      )}
      {screen === "quiz" && (
        <QuizScreen
          key={JSON.stringify(questions)}
          questions={questions}
          difficulty={difficulty}     // ← pass down
          onFinish={handleFinish}
        />
      )}
      {screen === "results" && (
        <ResultsScreen
          results={results}
          quizId={quizId}
          difficulty={difficulty}     // ← pass down
          durationSeconds={durationSeconds}
          onRetry={() => {
            setStartTime(Date.now());
            setScreen("quiz");
          }}
          onNew={() => {
            setQuestions([]);
            setResults([]);
            setQuizId(null);
            setDifficulty("medium");
            setScreen("setup");
          }}
        />
      )}
    </div>
  );
}

export default QuizMaker;