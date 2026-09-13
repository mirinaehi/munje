import { useEffect, useState } from 'react';
import { submitAnswer } from '../services/api.js';
import Icon from './Icon.jsx';

export default function QuestionPanel({
  question,
  result,
  onResult,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  positionLabel,
}) {
  const [answer, setAnswer] = useState(getInitialAnswer(question, result));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAnswer(getInitialAnswer(question, result));
    setError('');
  }, [question.id, result]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isAnswerEmpty(question, answer) || result) return;

    setIsSubmitting(true);
    setError('');

    try {
      onResult(await submitAnswer(question.id, answer));
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

        <AnswerInput
          answer={answer}
          disabled={Boolean(result) || isSubmitting}
          onChange={setAnswer}
          question={question}
          result={result}
        />

        {result && (
          <div className={`feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status">
            <div className="feedback-icon">{result.correct ? <Icon name="spark" /> : '!'}</div>
            <div>
              <strong>{result.correct ? '정답이에요!' : '아쉽지만 정답이 아니에요.'}</strong>
              <p>{result.explanation}</p>
              {question.type !== 'multiple-choice' && (
                <p className="answer-reveal">정답: {formatCorrectAnswer(result.correctAnswer)}</p>
              )}
            </div>
          </div>
        )}

        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="submit-row">
          <p>{positionLabel} · {result ? '다음 문제로 이동할 수 있어요.' : '답안을 입력한 뒤 제출하면 바로 확인할 수 있어요.'}</p>
          <div className="action-group">
            <button className="nav-button" disabled={!hasPrevious} onClick={onPrevious} type="button">
              <Icon name="back" size={17} />
              이전
            </button>
            <button className="submit-button" disabled={isAnswerEmpty(question, answer) || isSubmitting || Boolean(result)} type="submit">
              {isSubmitting ? '채점 중…' : result ? '제출 완료' : '답안 제출'}
              {!result && <Icon name="arrow" size={18} />}
            </button>
            <button className="nav-button" disabled={!hasNext} onClick={onNext} type="button">
              다음
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      </form>
    </article>
  );
}

function getInitialAnswer(question, result) {
  if (result) return result.submittedAnswer;
  if (question.type === 'multiple-choice') return null;
  if (question.type === 'fill-blank') {
    return Object.fromEntries(question.blanks.map((blank) => [blank.id, '']));
  }
  return '';
}

function isAnswerEmpty(question, answer) {
  if (question.type === 'multiple-choice') return answer === null;
  if (question.type === 'fill-blank') {
    return question.blanks.some((blank) => String(answer?.[blank.id] ?? '').trim() === '');
  }
  return String(answer ?? '').trim() === '';
}

function formatCorrectAnswer(correctAnswer) {
  if (correctAnswer && typeof correctAnswer === 'object') {
    return Object.values(correctAnswer).join(', ');
  }

  return correctAnswer;
}

function AnswerInput({ question, answer, result, disabled, onChange }) {
  if (question.type === 'multiple-choice') {
    return (
      <fieldset className="choices" disabled={disabled}>
        <legend className="sr-only">답을 하나 선택하세요</legend>
        {question.choices.map((choice, index) => {
          const isSelected = answer === index;
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
                onChange={() => onChange(index)}
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
    );
  }

  if (question.type === 'fill-blank') {
    return (
      <div className="blank-inputs">
        {question.blanks.map((blank) => (
          <label className="answer-field" key={blank.id}>
            <span>{blank.label}</span>
            <input
              disabled={disabled}
              onChange={(event) => onChange({ ...answer, [blank.id]: event.target.value })}
              placeholder="빈칸에 들어갈 값을 입력하세요"
              type="text"
              value={answer?.[blank.id] ?? ''}
            />
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'sql') {
    return (
      <label className="answer-field">
        <span>SQL 답안</span>
        <textarea
          className="sql-answer"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="SELECT ..."
          value={answer}
        />
      </label>
    );
  }

  return (
    <label className="answer-field">
      <span>답안</span>
      <input
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="답을 입력하세요"
        type="text"
        value={answer}
      />
    </label>
  );
}
