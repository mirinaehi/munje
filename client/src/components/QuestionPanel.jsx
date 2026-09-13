import { useEffect, useState } from 'react';
import { submitAnswer } from '../services/api.js';
import Icon from './Icon.jsx';

export default function QuestionPanel({ question, result, onResult }) {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedChoice(result?.submittedAnswer ?? null);
    setError('');
  }, [question.id, result]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (selectedChoice === null || result) return;

    setIsSubmitting(true);
    setError('');

    try {
      onResult(await submitAnswer(question.id, selectedChoice));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="question-panel">
      <header className="question-header">
        <div>
          <p className="eyebrow">{question.unit}</p>
          <h2>{question.title}</h2>
        </div>
        <span className="score-badge">{question.score}점</span>
      </header>

      <div className="rule" />

      <form onSubmit={handleSubmit}>
        <p className="question-content">{question.content}</p>
        {question.code && <pre className="code-block"><code>{question.code}</code></pre>}

        <fieldset className="choices" disabled={Boolean(result) || isSubmitting}>
          <legend className="sr-only">답을 하나 선택하세요</legend>
          {question.choices.map((choice, index) => {
            const isSelected = selectedChoice === index;
            const isCorrectChoice = result?.correctAnswer === index;
            const isIncorrectChoice = result && isSelected && !result.correct;

            return (
              <label
                className={`choice ${isSelected ? 'selected' : ''} ${isCorrectChoice ? 'correct-choice' : ''} ${isIncorrectChoice ? 'incorrect-choice' : ''}`}
                key={choice}
              >
                <input
                  checked={isSelected}
                  name={`answer-${question.id}`}
                  onChange={() => setSelectedChoice(index)}
                  type="radio"
                  value={index}
                />
                <span className="choice-index">{index + 1}</span>
                <span className="choice-text">{choice}</span>
                {isCorrectChoice && <span className="choice-mark"><Icon name="check" size={17} /></span>}
              </label>
            );
          })}
        </fieldset>

        {result && (
          <div className={`feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status">
            <div className="feedback-icon">{result.correct ? <Icon name="spark" /> : '!'}</div>
            <div>
              <strong>{result.correct ? '정답이에요!' : '아쉽지만 정답이 아니에요.'}</strong>
              <p>{result.explanation}</p>
            </div>
          </div>
        )}

        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="submit-row">
          <p>{result ? '문제 목록에서 다른 문제를 선택해 보세요.' : '답을 고른 뒤 제출하면 바로 확인할 수 있어요.'}</p>
          <button className="submit-button" disabled={selectedChoice === null || isSubmitting || Boolean(result)} type="submit">
            {isSubmitting ? '채점 중…' : result ? '제출 완료' : '답안 제출'}
            {!result && <Icon name="arrow" size={18} />}
          </button>
        </div>
      </form>
    </article>
  );
}
