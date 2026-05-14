import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function QuizHistory() {
  const navigate = useNavigate();
  
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 1️⃣ Get the real logged-in user (Same as Profile.jsx)
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        // 2️⃣ Fetch history using the REAL user.id
        const res = await fetch(`${API_BASE}/api/quiz/history?user_id=${user.id}`);
        const data = await res.json();

        if (data.success) {
          setQuizHistory(data.history);
        } else {
          setError('Failed to load quiz history.');
        }

      } catch (err) {
        console.error('Quiz history fetch error:', err);
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  return (
    <div className="qh-container">
      <div className="qh-wrapper">
        <div className="qh-card">
          <div className="qh-card-header">
            <div>
              <p className="qh-heading">Quiz History</p>
              <p className="qh-subtitle">
                Review your past quiz performance by category, topic, score, and date.
              </p>
            </div>
          </div>

          <div className="qh-card-body">
            <div className="qh-table-wrap">

              {/* ── Loading State ── */}
              {loading && (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Loading history...
                </p>
              )}

              {/* ── Error State ── */}
              {!loading && error && (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                  {error}
                </p>
              )}

              {/* ── Empty State ── */}
              {!loading && !error && quizHistory.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No quiz history yet. Go take a quiz!
                </p>
              )}

              {/* ── Data Table ── */}
              {!loading && !error && quizHistory.length > 0 && (
                <table className="qh-table">
                  <thead>
                    <tr>
                      <th>Topic Name</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.topic}</td>
                        <td>{item.score}</td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizHistory;