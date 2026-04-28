import './QuizHistory.css';

const quizHistoryData = [
  { id: 1, topic: 'Paraphrasing Basics', score: '17/20', date: 'Apr 25, 2026' },
  { id: 2, topic: 'Humanizer Practice', score: '18/20', date: 'Apr 20, 2026' },
  { id: 3, topic: 'Image Text Review', score: '19/20', date: 'Apr 18, 2026' },
  { id: 4, topic: 'PDF to Text', score: '18/20', date: 'Apr 15, 2026' },
];

export function QuizHistory() {
  return (
    <div className="qh-container">
      <div className="qh-wrapper">
        <div className="qh-card">
          <div className="qh-card-header">
            <div>
              <p className="qh-heading">Quiz History</p>
              <p className="qh-subtitle">Review your past quiz performance by category, topic, score, and date.</p>
            </div>
          </div>

          <div className="qh-card-body">
            <div className="qh-table-wrap">
              <table className="qh-table">
                <thead>
                  <tr>
                    <th>Topic Name</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizHistoryData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.topic}</td>
                      <td>{item.score}</td>
                      <td>{item.date}</td>
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

export default QuizHistory;
