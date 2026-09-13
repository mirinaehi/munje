import { useEffect, useMemo, useState } from 'react';

export default function TeacherAssignmentManager({
  assignments,
  questionSets,
  status,
  error,
  onSave,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(assignments[0]?.userId ?? '');
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.userId === selectedStudentId) ?? assignments[0] ?? null,
    [assignments, selectedStudentId],
  );
  const [draftQuestionSetIds, setDraftQuestionSetIds] = useState(selectedAssignment?.questionSetIds ?? []);

  useEffect(() => {
    if (!selectedStudentId && assignments[0]) {
      setSelectedStudentId(assignments[0].userId);
      setDraftQuestionSetIds(assignments[0].questionSetIds);
    }
  }, [assignments, selectedStudentId]);

  function selectStudent(studentId) {
    const assignment = assignments.find((item) => item.userId === studentId);
    setSelectedStudentId(studentId);
    setDraftQuestionSetIds(assignment?.questionSetIds ?? []);
  }

  function toggleQuestionSet(questionSetId) {
    setDraftQuestionSetIds((current) => (
      current.includes(questionSetId)
        ? current.filter((id) => id !== questionSetId)
        : [...current, questionSetId]
    ));
  }

  async function handleSave() {
    if (!selectedAssignment) return;
    await onSave(selectedAssignment.userId, draftQuestionSetIds);
  }

  return (
    <section className="teacher-manager" aria-label="교사용 문제 세트 배정">
      <div className="teacher-manager-heading">
        <div>
          <p className="eyebrow">ASSIGNMENTS</p>
          <h2>문제 배정</h2>
          <p>학생별로 풀 수 있는 문제 세트를 지정합니다.</p>
        </div>
        <button className="submit-button" disabled={!selectedAssignment || status === 'saving'} onClick={handleSave} type="button">
          {status === 'saving' ? '저장 중...' : '배정 저장'}
        </button>
      </div>

      {error && <p className="teacher-error">{error}</p>}
      <div className="assignment-grid">
        <aside className="teacher-question-list">
          <div className="list-heading">
            <span>학생</span>
            <strong>{assignments.length}</strong>
          </div>
          <div className="teacher-list-items">
            {assignments.map((assignment) => (
              <button
                className={`teacher-question-item ${assignment.userId === selectedAssignment?.userId ? 'active' : ''}`}
                key={assignment.userId}
                onClick={() => selectStudent(assignment.userId)}
                type="button"
              >
                <strong>{assignment.name}</strong>
                <span>{assignment.questionSetIds.length}개 세트 배정</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="question-picker">
          <strong>{selectedAssignment ? `${selectedAssignment.name}에게 배정` : '학생을 선택하세요'}</strong>
          <div className="picker-list">
            {questionSets.map((questionSet) => (
              <label className="picker-item" key={questionSet.id}>
                <input
                  checked={draftQuestionSetIds.includes(questionSet.id)}
                  onChange={() => toggleQuestionSet(questionSet.id)}
                  type="checkbox"
                />
                <span>{questionSet.title}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
