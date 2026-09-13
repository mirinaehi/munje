import { useEffect, useMemo, useState } from 'react';
import Icon from './components/Icon.jsx';
import QuestionList from './components/QuestionList.jsx';
import QuestionPanel from './components/QuestionPanel.jsx';
import { getQuestions } from './services/api.js';

function App() {
  const [questions, setQuestions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [results, setResults] = useState({});
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getQuestions()
      .then((data) => {
        setQuestions(data);
        setSelectedId(data[0]?.id ?? null);
        setStatus('ready');
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus('error');
      });
  }, []);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedId),
    [questions, selectedId],
  );
  const solvedCount = Object.keys(results).length;

  function recordResult(result) {
    setResults((current) => ({ ...current, [result.questionId]: result }));
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="문제 홈">
          <span className="brand-mark">문</span>
          <span>문제</span>
        </a>
        <div className="step-label"><span /> 2단계 · 객관식 문제</div>
        <div className="profile"><span>학생</span><strong>민서</strong><span className="avatar">민</span></div>
      </header>

      <main className="main-content">
        <section className="intro">
          <div>
            <p className="eyebrow">PRACTICE SESSION</p>
            <h1>개념을 확인해 볼까요?</h1>
            <p>문제를 골라 답안을 제출하면 정답과 해설을 바로 확인할 수 있어요.</p>
          </div>
          <div className="progress-summary">
            <div className="progress-copy"><span>풀이 현황</span><strong>{solvedCount} / {questions.length}</strong></div>
            <div className="progress-track"><span style={{ width: questions.length ? `${(solvedCount / questions.length) * 100}%` : '0%' }} /></div>
          </div>
        </section>

        {status === 'loading' && <div className="state-card"><span className="loader" />문제를 불러오고 있어요.</div>}
        {status === 'error' && <div className="state-card error-state"><strong>문제를 불러오지 못했습니다.</strong><span>{error}</span></div>}
        {status === 'ready' && questions.length === 0 && <div className="state-card">등록된 문제가 없습니다.</div>}

        {status === 'ready' && selectedQuestion && (
          <div className="workspace">
            <QuestionList
              questions={questions}
              results={results}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <QuestionPanel
              key={selectedQuestion.id}
              question={selectedQuestion}
              result={results[selectedQuestion.id]}
              onResult={recordResult}
            />
          </div>
        )}
      </main>

      <footer><Icon name="book" size={16} /> 작은 확인이 단단한 실력을 만듭니다.</footer>
    </div>
  );
}

export default App;
