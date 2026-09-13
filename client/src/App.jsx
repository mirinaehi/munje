import { useEffect, useMemo, useState } from 'react';
import ContextPanel from './components/ContextPanel.jsx';
import Icon from './components/Icon.jsx';
import QuestionList from './components/QuestionList.jsx';
import QuestionPanel from './components/QuestionPanel.jsx';
import QuestionSetSelector from './components/QuestionSetSelector.jsx';
import TeacherQuestionManager from './components/TeacherQuestionManager.jsx';
import { getCurrentUser, getQuestionSet, getQuestionSets, getUsers, submitQuestionSet } from './services/api.js';
import {
  createTeacherQuestion,
  deleteTeacherQuestion,
  getTeacherQuestions,
  updateTeacherQuestion,
} from './services/api.js';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [results, setResults] = useState({});
  const [submission, setSubmission] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [submissionError, setSubmissionError] = useState('');
  const [teacherQuestions, setTeacherQuestions] = useState([]);
  const [teacherStatus, setTeacherStatus] = useState('idle');
  const [teacherError, setTeacherError] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getUsers(), getCurrentUser()])
      .then(([userData, user]) => {
        setUsers(userData);
        setCurrentUser(user);
        return getQuestionSets();
      })
      .then((questionSetData) => {
        setQuestionSets(questionSetData);
        setSelectedSetId(questionSetData[0]?.id ?? null);
        setStatus(questionSetData.length === 0 ? 'ready' : 'loading-set');
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
        setSubmission(null);
        setSubmissionStatus('idle');
        setSubmissionError('');
        setStatus('ready');
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus('error');
      });
  }, [selectedSetId]);

  useEffect(() => {
    if (currentUser?.role !== 'teacher') return;

    setTeacherStatus('loading');
    setTeacherError('');

    getTeacherQuestions(currentUser.id)
      .then((data) => {
        setTeacherQuestions(data.questions);
        setTeacherStatus('idle');
      })
      .catch((loadError) => {
        setTeacherError(loadError.message);
        setTeacherStatus('idle');
      });
  }, [currentUser]);

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
  const isStudent = currentUser?.role === 'student';
  const isTeacher = currentUser?.role === 'teacher';

  function recordResult(result) {
    setResults((current) => ({ ...current, [result.questionId]: result }));
  }

  function moveToQuestion(nextIndex) {
    const nextQuestion = questions[nextIndex];
    if (nextQuestion) setSelectedId(nextQuestion.id);
  }

  async function submitCurrentSet() {
    if (!currentSet || !isComplete || !isStudent || submissionStatus === 'saving') return;

    setSubmissionStatus('saving');
    setSubmissionError('');

    try {
      const savedSubmission = await submitQuestionSet({
        userId: currentUser.id,
        questionSetId: currentSet.id,
        answers: questions.map((question) => ({
          questionId: question.id,
          answer: results[question.id].submittedAnswer,
        })),
      });

      setSubmission(savedSubmission);
      setSubmissionStatus('saved');
    } catch (submitError) {
      setSubmissionError(submitError.message);
      setSubmissionStatus('error');
    }
  }

  async function selectUser(userId) {
    setStatus('loading');
    setSubmission(null);
    setSubmissionStatus('idle');
    setSubmissionError('');
    setResults({});

    try {
      const user = await getCurrentUser(userId);
      setCurrentUser(user);

      if (!selectedSetId) {
        setStatus('ready');
        return;
      }

      setStatus('loading-set');
      const questionSet = await getQuestionSet(selectedSetId);
      setCurrentSet(questionSet);
      setSelectedId(questionSet.questions[0]?.id ?? null);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  }

  async function reloadTeacherQuestions() {
    if (!currentUser || !isTeacher) return;

    const data = await getTeacherQuestions(currentUser.id);
    setTeacherQuestions(data.questions);
  }

  async function createManagedQuestion(question) {
    setTeacherStatus('saving');
    setTeacherError('');

    try {
      await createTeacherQuestion(currentUser.id, question);
      await reloadTeacherQuestions();
      setTeacherStatus('idle');
    } catch (saveError) {
      setTeacherError(saveError.message);
      setTeacherStatus('idle');
    }
  }

  async function updateManagedQuestion(questionId, question) {
    setTeacherStatus('saving');
    setTeacherError('');

    try {
      await updateTeacherQuestion(currentUser.id, questionId, question);
      await reloadTeacherQuestions();
      setTeacherStatus('idle');
    } catch (saveError) {
      setTeacherError(saveError.message);
      setTeacherStatus('idle');
    }
  }

  async function deleteManagedQuestion(questionId) {
    setTeacherStatus('saving');
    setTeacherError('');

    try {
      await deleteTeacherQuestion(currentUser.id, questionId);
      await reloadTeacherQuestions();
      setTeacherStatus('idle');
    } catch (deleteError) {
      setTeacherError(deleteError.message);
      setTeacherStatus('idle');
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="문제 홈">
          <span className="brand-mark">문</span>
          <span>문제</span>
        </a>
        <div className="step-label"><span /> 8단계 · 교사 관리</div>
        <div className="profile"><span>{currentUser?.role === 'teacher' ? '교사' : '학생'}</span><strong>{currentUser?.name ?? '사용자'}</strong><span className="avatar">{currentUser?.name?.[0] ?? '문'}</span></div>
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

        <section className="user-switcher" aria-label="임시 사용자 선택">
          <div>
            <strong>임시 사용자</strong>
            <p>{isStudent ? '학생은 문제를 풀고 최종 제출할 수 있어요.' : '교사는 현재 문제 세트를 검토하는 읽기 모드입니다.'}</p>
          </div>
          <div className="user-options">
            {users.map((user) => (
              <button
                className={`user-chip ${currentUser?.id === user.id ? 'active' : ''}`}
                key={user.id}
                onClick={() => selectUser(user.id)}
                type="button"
              >
                <span>{user.role === 'teacher' ? '교사' : '학생'}</span>
                <strong>{user.name}</strong>
              </button>
            ))}
          </div>
        </section>

        {isTeacher && (
          <TeacherQuestionManager
            questions={teacherQuestions}
            status={teacherStatus}
            error={teacherError}
            onCreate={createManagedQuestion}
            onUpdate={updateManagedQuestion}
            onDelete={deleteManagedQuestion}
          />
        )}

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
                disabled={!isStudent}
              />
            </div>
          </div>
        )}

        {isComplete && (
          <section className="complete-card" aria-live="polite">
            <Icon name="check" size={22} />
            <div>
              <strong>{submission ? '제출 기록 저장 완료' : '세트 풀이 완료'}</strong>
              <p>
                총 {questions.length}문제 중 {solvedCount}문제를 풀었고, 현재 점수는 {totalScore}점입니다.
                {submission && ` ${submission.attempt}차 제출로 저장되었습니다.`}
              </p>
              {!isStudent && <p className="submission-error">교사 계정은 제출할 수 없습니다.</p>}
              {submissionError && <p className="submission-error">{submissionError}</p>}
            </div>
            <button
              className="submit-button final-submit"
              disabled={!isStudent || submissionStatus === 'saving' || submissionStatus === 'saved'}
              onClick={submitCurrentSet}
              type="button"
            >
              {submissionStatus === 'saving' ? '저장 중...' : submissionStatus === 'saved' ? '저장 완료' : '최종 제출'}
            </button>
          </section>
        )}
      </main>

      <footer><Icon name="book" size={16} /> 작은 확인이 단단한 실력을 만듭니다.</footer>
    </div>
  );
}

export default App;
