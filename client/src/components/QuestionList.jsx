export default function QuestionList({ questions, selectedId, onSelect, results }) {
  return (
    <aside className="question-list" aria-label="문제 목록">
      <div className="list-heading">
        <span>세트 문제</span>
        <strong>{questions.length}</strong>
      </div>
      <div className="list-items">
        {questions.map((question, index) => {
          const result = results[question.id];

          return (
            <button
              className={`question-link ${selectedId === question.id ? 'active' : ''}`}
              key={question.id}
              onClick={() => onSelect(question.id)}
              type="button"
            >
              <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="question-link-copy">
                <strong>{question.title}</strong>
                <small>{question.score}점 · {question.difficulty === 'easy' ? '쉬움' : '보통'}</small>
              </span>
              {result && (
                <span className={`result-dot ${result.correct ? 'correct' : 'incorrect'}`} aria-label={result.correct ? '정답' : '오답'}>
                  {result.correct ? '✓' : '!'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
