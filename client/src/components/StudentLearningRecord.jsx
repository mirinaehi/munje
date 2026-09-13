function formatPercent(value) {
  return `${value ?? 0}%`;
}

export default function StudentLearningRecord({ analytics, status, error, onRefresh }) {
  const summary = analytics?.summary ?? {
    submissionCount: 0,
    answerCount: 0,
    correctCount: 0,
    accuracy: 0,
    scoreRate: 0,
  };
  const hasData = summary.submissionCount > 0;

  return (
    <section className="student-record" aria-label="나의 학습 기록">
      <div className="student-record-heading">
        <div>
          <p className="eyebrow">MY PROGRESS</p>
          <h2>나의 학습 기록</h2>
        </div>
        <button className="nav-button" onClick={onRefresh} type="button">새로고침</button>
      </div>

      {status === 'loading' && <p className="teacher-muted">학습 기록을 불러오고 있어요.</p>}
      {error && <p className="teacher-error">{error}</p>}

      <div className="analytics-summary">
        <div><span>제출</span><strong>{summary.submissionCount}</strong></div>
        <div><span>정답률</span><strong>{formatPercent(summary.accuracy)}</strong></div>
        <div><span>점수율</span><strong>{formatPercent(summary.scoreRate)}</strong></div>
        <div><span>정답</span><strong>{summary.correctCount}/{summary.answerCount}</strong></div>
      </div>

      {!hasData && <div className="state-card analytics-empty">아직 제출 기록이 없습니다.</div>}

      {hasData && (
        <div className="analytics-grid">
          <section className="analytics-panel">
            <strong>취약 단원</strong>
            {analytics.unitStats.map((stat) => (
              <div className="analytics-row" key={stat.unit}>
                <span>{stat.unit}</span>
                <strong>{formatPercent(stat.accuracy)}</strong>
              </div>
            ))}
          </section>

          <section className="analytics-panel">
            <strong>틀린 문제</strong>
            {analytics.missedQuestions.length === 0 && <p className="teacher-muted">틀린 문제가 없습니다.</p>}
            {analytics.missedQuestions.map((question) => (
              <div className="analytics-row" key={question.questionId}>
                <span>{question.title}</span>
                <strong>{question.missedCount}회</strong>
              </div>
            ))}
          </section>

          <section className="analytics-panel">
            <strong>최근 제출</strong>
            {analytics.recentSubmissions.map((submission) => (
              <div className="analytics-row" key={submission.id}>
                <span>{submission.questionSetId} · {submission.attempt}차</span>
                <strong>{formatPercent(submission.scoreRate)}</strong>
              </div>
            ))}
          </section>
        </div>
      )}
    </section>
  );
}
