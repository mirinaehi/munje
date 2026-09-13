import { useEffect, useMemo, useState } from 'react';
import ContextPanel from './components/ContextPanel.jsx';
import Icon from './components/Icon.jsx';
import QuestionList from './components/QuestionList.jsx';
import QuestionPanel from './components/QuestionPanel.jsx';
import QuestionSetSelector from './components/QuestionSetSelector.jsx';
import { getQuestionSet, getQuestionSets } from './services/api.js';

function App() {
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [results, setResults] = useState({});
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getQuestionSets()
      .then((data) => {
        setQuestionSets(data);
        setSelectedSetId(data[0]?.id ?? null);
        setStatus(data.length === 0 ? 'ready' : 'loading-set');
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    if (!selectedSetId) return;

    setStatus('loading-set');
    getQuestionSet(selectedSetId)
      .then((data) => {
        setCurrentSet(data);
        setSelectedId(data.questions[0]?.id ?? null);
        setResults({});
        setStatus('ready');
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus('error');
      });
  }, [selectedSetId]);

  const questions = currentSet?.questions ?? [];
  const contexts = currentSet?.contexts ?? [];
  const selectedIndex = questions.findIndex((question) => question.id === selectedId);
  const selectedQuestion = useMemo(() => questions[selectedIndex] ?? null, [questions, selectedIndex]);
  const selectedContext = useMemo(
    () => contexts.find((context) => context.id === selectedQuestion?.contextId) ?? null,
    [contexts, selectedQuestion],
  );
  const solvedCount = Object.keys(results).length;
  const totalScore = Object.values(results).reduce((sum, result) => sum + (result.correct ? result.score : 0), 0);
  const isComplete = questions.length > 0 && solvedCount === questions.length;

  function recordResult(result) {
    setResults((current) => ({ ...current, [result.questionId]: result }));
  }

  function moveToQuestion(nextIndex) {
    const nextQuestion = questions[nextIndex];
    if (nextQuestion) setSelectedId(nextQuestion.id);
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="문제 홈">
          <span className="brand-mark">문</span>
          <span>문제</span>
        </a>
        <div className="step-label"><span /> 5단계 · 공통 지문</div>
        <div className="profile"><span>학생</span><strong>민서</strong><span className="avatar">민</span></div>
      </header>

      <main className="main-content">
        <section className="intro">
          <div>
            <p className="eyebrow">PRACTICE SESSION</p>
            <h1>{currentSet?.title ?? '문제 세트를 골라 풀어볼까요?'}</h1>
            <p>{currentSet?.description ?? '여러 문제를 하나의 흐름으로 풀고 진행 상황을 확인할 수 있어요.'}</p>
          </div>
          <div className="progress-summary">
            <div className="progress-copy"><span>풀이 현황</span><strong>{solvedCount} / {questions.length}</strong></div>
            <div className="progress-track"><span style={{ width: questions.length ? `${(solvedCount / questions.length) * 100}%` : '0%' }} /></div>
            {currentSet && <p className="score-summary">현재 점수 {totalScore} / {currentSet.totalScore}</p>}
          </div>
        </section>

        <QuestionSetSelector questionSets={questionSets} selectedId={selectedSetId} onSelect={setSelectedSetId} />

        {status === 'loading' && <div className="state-card"><span className="loader" />문제 세트 목록을 불러오고 있어요.</div>}
        {status === 'loading-set' && <div className="state-card"><span className="loader" />문제 세트를 준비하고 있어요.</div>}
        {status === 'error' && <div className="state-card error-state"><strong>문제를 불러오지 못했습니다.</strong><span>{error}</span></div>}
        {status === 'ready' && questions.length === 0 && <div className="state-card">등록된 문제 세트가 없습니다.</div>}

        {status === 'ready' && selectedQuestion && (
          <div className="workspace">
            <QuestionList
              questions={questions}
              results={results}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <div className="study-area">
              <ContextPanel context={selectedContext} />
              <QuestionPanel
                key={selectedQuestion.id}
                question={selectedQuestion}
                result={results[selectedQuestion.id]}
                positionLabel={`${selectedIndex + 1} / ${questions.length}`}
                hasPrevious={selectedIndex > 0}
                hasNext={selectedIndex < questions.length - 1}
                onPrevious={() => moveToQuestion(selectedIndex - 1)}
                onNext={() => moveToQuestion(selectedIndex + 1)}
                onResult={recordResult}
              />
            </div>
          </div>
        )}

        {isComplete && (
          <section className="complete-card" aria-live="polite">
            <Icon name="check" size={22} />
            <div>
              <strong>세트 풀이 완료</strong>
              <p>총 {questions.length}문제 중 {solvedCount}문제를 풀었고, 현재 점수는 {totalScore}점입니다.</p>
            </div>
          </section>
        )}
      </main>

      <footer><Icon name="book" size={16} /> 작은 확인이 단단한 실력을 만듭니다.</footer>
    </div>
  );
}

export default App;
