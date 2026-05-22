import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const LETTERS = ["A", "B", "C", "D"];

// ── Skeleton ──
function SkeletonBox({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 0%, #e4e4e4 50%, #f0f0f0 100%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}

function HistorySkeleton() {
  return (
    <div className="qh-container">
      <div className="qh-wrapper">
        <div className="qh-card">
          <div className="qh-card-header">
            <div style={{ flex: 1 }}>
              <SkeletonBox width="160px" height="22px" style={{ marginBottom: '8px' }} />
              <SkeletonBox width="320px" height="14px" />
            </div>
          </div>
          <div className="qh-card-body">
            <div className="qh-table-wrap">
              <table className="qh-table">
                <thead>
                  <tr>
                    {['Topic Name', 'Score', 'Date', ''].map((h, i) => (
                      <th key={i}>
                        <SkeletonBox width={i === 0 ? '80px' : '50px'} height="12px" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, ri) => (
                    <tr key={ri}>
                      <td><SkeletonBox width={`${120 + ri * 10}px`} height="14px" /></td>
                      <td><SkeletonBox width="50px" height="14px" /></td>
                      <td><SkeletonBox width="80px" height="14px" /></td>
                      <td><SkeletonBox width="60px" height="28px" borderRadius="6px" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Difficulty Badge ──
function DifficultyBadge({ difficulty }) {
  const config = {
    easy:   { color: '#16a34a', bg: '#f0fdf4', label: 'Easy' },
    medium: { color: '#d97706', bg: '#fffbeb', label: 'Medium' },
    hard:   { color: '#dc2626', bg: '#fef2f2', label: 'Hard' },
  };
  const c = config[difficulty] || config.medium;

  return (
    <span style={{
      fontSize: '11px', fontWeight: '600',
      padding: '2px 10px', borderRadius: '999px',
      color: c.color, background: c.bg,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {c.label}
    </span>
  );
}

// ── Score Ring ──
function ScoreRing({ score, total, size = 48 }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700', color,
      }}>
        {pct}%
      </div>
    </div>
  );
}

// ── Slide-out Detail Panel ──
function DetailPanel({ quizId, userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_BASE}/api/quiz/history/detail?quiz_id=${quizId}&user_id=${userId}`
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.detail || 'Failed to load details');
        }

        if (json.success) {
          setData(json);
        } else {
          setError('Failed to load details.');
        }
      } catch (err) {
        console.error('Detail fetch error:', err);
        setError(err.message || 'Failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [quizId, userId]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const questions = data?.quiz?.questions || [];
  const answers = data?.attempt?.answers || [];
  const attempt = data?.attempt;
  const quiz = data?.quiz;

  const score = attempt?.score || 0;
  const total = attempt?.total || 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const correctCount = answers.filter(a => a.correct).length;
  const wrongCount = answers.filter(a => a.revealed && !a.correct).length;
  const skippedCount = answers.filter(a => !a.revealed).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '520px', maxWidth: '90vw',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s ease',
      }}>

        {/* Panel Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: '16px',
              fontWeight: '700', color: '#111827',
            }}>
              {loading ? 'Loading...' : (quiz?.title || 'Quiz Detail')}
            </h2>
            {!loading && quiz && (
              <div style={{
                display: 'flex', gap: '8px',
                alignItems: 'center', marginTop: '6px',
              }}>
                <DifficultyBadge difficulty={quiz.difficulty} />
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {questions.length} questions
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px',
              borderRadius: '8px', border: '1px solid #e5e7eb',
              background: '#f9fafb', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', color: '#6b7280',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            ✕
          </button>
        </div>

        {/* Panel Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 24px',
        }}>

          {/* Loading skeleton */}
          {loading && (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px', marginBottom: '24px',
              }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    padding: '14px', background: '#f9fafb',
                    borderRadius: '10px', textAlign: 'center',
                  }}>
                    <SkeletonBox width="40px" height="24px" style={{ margin: '0 auto 6px' }} />
                    <SkeletonBox width="50px" height="11px" style={{ margin: '0 auto' }} />
                  </div>
                ))}
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  marginBottom: '16px', padding: '16px',
                  background: '#f9fafb', borderRadius: '10px',
                }}>
                  <SkeletonBox width="100%" height="16px" style={{ marginBottom: '12px' }} />
                  {[1, 2, 3, 4].map(j => (
                    <SkeletonBox key={j} width="90%" height="14px"
                      style={{ marginBottom: '6px' }} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              textAlign: 'center', padding: '3rem 1rem',
              color: '#dc2626',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ fontWeight: '600', marginBottom: '6px' }}>{error}</p>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                Check the console for details.
              </p>
            </div>
          )}

          {/* Data */}
          {!loading && !error && data && (
            <>
              {/* Score summary */}
              <div style={{
                display: 'flex', gap: '12px',
                marginBottom: '24px', flexWrap: 'wrap',
              }}>
                {/* Big score ring */}
                <div style={{
                  flex: '0 0 auto',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 20px',
                  background: '#f9fafb', borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                }}>
                  <ScoreRing score={score} total={total} size={64} />
                </div>

                {/* Stats grid */}
                <div style={{
                  flex: 1, display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}>
                  <div style={{
                    padding: '12px', background: '#f0fdf4',
                    borderRadius: '10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                      {correctCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a' }}>Correct</div>
                  </div>
                  <div style={{
                    padding: '12px', background: '#fef2f2',
                    borderRadius: '10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                      {wrongCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#dc2626' }}>Wrong</div>
                  </div>
                  <div style={{
                    padding: '12px', background: '#f3f4f6',
                    borderRadius: '10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#6b7280' }}>
                      {skippedCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Skipped</div>
                  </div>
                </div>
              </div>

              {/* Duration bar */}
              {attempt?.duration_seconds > 0 && (
                <div style={{
                  padding: '10px 14px', marginBottom: '20px',
                  background: '#f9fafb', borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: '13px',
                }}>
                  <span style={{ color: '#6b7280' }}>⏱ Duration</span>
                  <span style={{ fontWeight: '600', color: '#111' }}>
                    {Math.floor(attempt.duration_seconds / 60)}m {attempt.duration_seconds % 60}s
                  </span>
                </div>
              )}

              {/* Questions label */}
              <div style={{
                fontSize: '13px', fontWeight: '600',
                color: '#374151', marginBottom: '12px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Questions & Answers
              </div>

              {/* Question cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q, qi) => {
                  const userAnswer = answers.find(a => a.question_index === qi);
                  const chosenIdx = userAnswer?.chosen ?? null;
                  const wasCorrect = userAnswer?.correct ?? false;
                  const wasRevealed = userAnswer?.revealed ?? false;
                  const correctIdx = q.correctIndex;

                  return (
                    <div key={qi} style={{
                      background: '#fff',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                    }}>
                      {/* Question header */}
                      <div style={{
                        display: 'flex', alignItems: 'flex-start',
                        gap: '10px', padding: '12px 14px',
                        borderBottom: '1px solid #f3f4f6',
                        background: !wasRevealed ? '#f9fafb'
                          : wasCorrect ? '#fafff9' : '#fffafa',
                      }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                          background: !wasRevealed ? '#e5e7eb'
                            : wasCorrect ? '#dcfce7' : '#fee2e2',
                          color: !wasRevealed ? '#9ca3af'
                            : wasCorrect ? '#16a34a' : '#dc2626',
                          fontSize: '11px', fontWeight: '700',
                        }}>
                          {!wasRevealed ? '—' : wasCorrect ? '✓' : '✗'}
                        </div>

                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '10px', fontWeight: '600',
                            color: '#9ca3af', textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            Q{qi + 1}
                          </span>
                          <p style={{
                            margin: '2px 0 0', fontSize: '13px',
                            fontWeight: '500', color: '#111827',
                            lineHeight: '1.5',
                          }}>
                            {q.question}
                          </p>
                        </div>
                      </div>

                      {/* Choices */}
                      <div style={{
                        padding: '10px 14px',
                        display: 'flex', flexDirection: 'column',
                        gap: '5px',
                      }}>
                        {q.choices.map((choice, ci) => {
                          const isCorrect = ci === correctIdx;
                          const isChosen = ci === chosenIdx;

                          let bg = '#f9fafb';
                          let border = '#e5e7eb';
                          let textColor = '#374151';
                          let letterBg = '#e5e7eb';
                          let letterColor = '#6b7280';

                          if (wasRevealed) {
                            if (isCorrect) {
                              bg = '#f0fdf4'; border = '#bbf7d0';
                              textColor = '#15803d';
                              letterBg = '#16a34a'; letterColor = 'white';
                            } else if (isChosen) {
                              bg = '#fef2f2'; border = '#fecaca';
                              textColor = '#991b1b';
                              letterBg = '#dc2626'; letterColor = 'white';
                            } else {
                              textColor = '#c0c0c0';
                              border = '#f0f0f0';
                            }
                          }

                          return (
                            <div key={ci} style={{
                              display: 'flex', alignItems: 'center',
                              gap: '8px', padding: '7px 10px',
                              borderRadius: '7px',
                              border: `1px solid ${border}`,
                              background: bg,
                            }}>
                              <span style={{
                                width: '20px', height: '20px',
                                borderRadius: '5px',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center',
                                background: letterBg, color: letterColor,
                                fontSize: '10px', fontWeight: '700',
                                flexShrink: 0,
                              }}>
                                {LETTERS[ci]}
                              </span>
                              <span style={{
                                fontSize: '12px', color: textColor,
                                flex: 1,
                              }}>
                                {choice}
                              </span>

                              {wasRevealed && isCorrect && (
                                <span style={{
                                  fontSize: '9px', fontWeight: '700',
                                  color: '#16a34a', textTransform: 'uppercase',
                                }}>
                                  ✓ Correct
                                </span>
                              )}
                              {wasRevealed && isChosen && !isCorrect && (
                                <span style={{
                                  fontSize: '9px', fontWeight: '700',
                                  color: '#dc2626', textTransform: 'uppercase',
                                }}>
                                  ✗ Your pick
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── MAIN COMPONENT ──
function QuizHistory() {
  const navigate = useNavigate();

  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 2500));

      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        setUserId(user.id);

        const [res] = await Promise.all([
          fetch(`${API_BASE}/api/quiz/history?user_id=${user.id}`),
          minLoadTime,
        ]);
        const data = await res.json();

        if (data.success) {
          setQuizHistory(data.history);
        } else {
          setError('Failed to load quiz history.');
        }
      } catch (err) {
        console.error('Quiz history fetch error:', err);
        setError('Something went wrong.');
        await minLoadTime;
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  const handleClose = useCallback(() => setSelectedQuiz(null), []);

  if (loading) return <HistorySkeleton />;

  return (
    <div className="qh-container">
      <div className="qh-wrapper">
        <div className="qh-card">

          {/* Header */}
          <div className="qh-card-header">
            <div>
              <p className="qh-heading">Quiz History</p>
              <p className="qh-subtitle">
                Review your past quiz performance by category, topic, score, and date.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="qh-card-body">
            <div className="qh-table-wrap">

              {error && (
                <p style={{
                  textAlign: 'center', padding: '2rem',
                  color: '#dc2626',
                }}>
                  {error}
                </p>
              )}

              {!error && quizHistory.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '3rem 2rem',
                  color: '#9ca3af',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                  <p style={{
                    fontSize: '16px', fontWeight: '600',
                    color: '#6b7280', marginBottom: '6px',
                  }}>
                    No quiz history yet
                  </p>
                  <p style={{ fontSize: '13px' }}>
                    Complete a quiz to see your results here.
                  </p>
                </div>
              )}

              {!error && quizHistory.length > 0 && (
                <table className="qh-table">
                  <thead>
                    <tr>
                      <th>Topic Name</th>
                      <th>Score</th>
                      <th>Date</th>
                      <th style={{ width: '80px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.topic}</td>
                        <td>{item.score}</td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => setSelectedQuiz(item)}
                            style={{
                              padding: '5px 14px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#2563eb',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#dbeafe';
                              e.currentTarget.style.borderColor = '#93c5fd';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#eff6ff';
                              e.currentTarget.style.borderColor = '#bfdbfe';
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Slide-out panel */}
      {selectedQuiz && (
        <DetailPanel
          quizId={selectedQuiz.quiz_id}
          userId={userId}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

export default QuizHistory;