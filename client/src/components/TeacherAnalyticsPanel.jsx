function formatPercent(value) {
  return `${value ?? 0}%`;
}

export default function TeacherAnalyticsPanel({ analytics, status, error, onRefresh }) {
  const summary = analytics?.summary ?? {
    submissionCount: 0,
    studentCount: 0,
    answerCount: 0,
    averageScoreRate: 0,
  };
  const hasData = summary.submissionCount > 0;

  return (
    <section className="teacher-manager" aria-label="학습 분석">
      <div className="teacher-manager-heading">
        <div>
          <p className="eyebrow">ANALYTICS</p>
          <h2>학습 분석</h2>
          <p>제출 기록을 기준으로 학생, 문제, 단원별 이해도를 확인합니다.</p>
        </div>
        <button className="nav-button" onClick={onRefresh} type="button">새로고침</button>
      </div>

      {status === 'loading' && <p className="teacher-muted">분석 데이터를 불러오고 있어요.</p>}
      {error && <p className="teacher-error">{error}</p>}

      <div className="analytics-summary">
        <div><span>제출</span><strong>{summary.submissionCount}</strong></div>
        <div><span>학생</span><strong>{summary.studentCount}</strong></div>
        <div><span>답안</span><strong>{summary.answerCount}</strong></div>
        <div><span>평균 점수율</span><strong>{formatPercent(summary.averageScoreRate)}</strong></div>
      </div>

      {!hasData && <div className="state-card analytics-empty">아직 제출 기록이 없습니다.</div>}

      {hasData && (
        <div className="analytics-grid">
          <section className="analytics-panel">
            <strong>취약 문제</strong>
            {analytics.questionStats.slice(0, 6).map((stat) => (
              <div className="analytics-row" key={stat.questionId}>
                <span>{stat.title}</span>
                <strong>{formatPercent(stat.accuracy)}</strong>
              </div>
            ))}
          </section>

          <section className="analytics-panel">
            <strong>단원별 정답률</strong>
            {analytics.unitStats.map((stat) => (
              <div className="analytics-row" key={stat.unit}>
                <span>{stat.unit}</span>
                <strong>{formatPercent(stat.accuracy)}</strong>
              </div>
            ))}
          </section>

          <section className="analytics-panel">
            <strong>학생별 점수율</strong>
            {analytics.studentStats.map((stat) => (
              <div className="analytics-row" key={stat.userId}>
                <span>{stat.name}</span>
                <strong>{formatPercent(stat.scoreRate)}</strong>
              </div>
            ))}
          </section>

          <section className="analytics-panel">
            <strong>최근 제출</strong>
            {analytics.recentSubmissions.map((submission) => (
              <div className="analytics-row" key={submission.id}>
                <span>{submission.name} · {submission.attempt}차</span>
                <strong>{formatPercent(submission.scoreRate)}</strong>
              </div>
            ))}
          </section>
        </div>
      )}
    </section>
  );
}
