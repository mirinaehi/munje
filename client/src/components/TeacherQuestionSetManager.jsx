import { useMemo, useState } from 'react';

const emptyQuestionSet = {
  title: '',
  description: '',
  isPublished: true,
  questions: [],
};

function toFormQuestionSet(questionSet) {
  return {
    title: questionSet.title ?? '',
    description: questionSet.description ?? '',
    isPublished: questionSet.isPublished ?? true,
    questions: questionSet.questions ?? [],
  };
}

export default function TeacherQuestionSetManager({
  questionSets,
  questions,
  status,
  error,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [formQuestionSet, setFormQuestionSet] = useState(emptyQuestionSet);
  const selectedQuestionSet = useMemo(
    () => questionSets.find((questionSet) => questionSet.id === editingId) ?? null,
    [editingId, questionSets],
  );
  const questionMap = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );

  function updateField(field, value) {
    setFormQuestionSet((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setFormQuestionSet(emptyQuestionSet);
  }

  function startEdit(questionSet) {
    setEditingId(questionSet.id);
    setFormQuestionSet(toFormQuestionSet(questionSet));
  }

  function toggleQuestion(questionId) {
    setFormQuestionSet((current) => {
      if (current.questions.includes(questionId)) {
        return { ...current, questions: current.questions.filter((id) => id !== questionId) };
      }

      return { ...current, questions: [...current.questions, questionId] };
    });
  }

  function moveQuestion(questionId, direction) {
    setFormQuestionSet((current) => {
      const index = current.questions.indexOf(questionId);
      const nextIndex = index + direction;

      if (index === -1 || nextIndex < 0 || nextIndex >= current.questions.length) return current;

      const nextQuestions = [...current.questions];
      [nextQuestions[index], nextQuestions[nextIndex]] = [nextQuestions[nextIndex], nextQuestions[index]];
      return { ...current, questions: nextQuestions };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (editingId) {
      await onUpdate(editingId, formQuestionSet);
    } else {
      await onCreate(formQuestionSet);
    }

    resetForm();
  }

  async function handleDelete() {
    if (!selectedQuestionSet) return;

    await onDelete(selectedQuestionSet.id);
    resetForm();
  }

  return (
    <section className="teacher-manager" aria-label="교사용 문제 세트 관리">
      <div className="teacher-manager-heading">
        <div>
          <p className="eyebrow">SET BUILDER</p>
          <h2>문제 세트 관리</h2>
          <p>문제를 선택하고 순서를 조정해서 학생에게 공개할 세트를 구성합니다.</p>
        </div>
        <button className="nav-button" onClick={resetForm} type="button">새 세트</button>
      </div>

      <div className="teacher-grid">
        <aside className="teacher-question-list">
          <div className="list-heading">
            <span>문제 세트</span>
            <strong>{questionSets.length}</strong>
          </div>
          {status === 'loading' && <p className="teacher-muted">문제 세트를 불러오고 있어요.</p>}
          {error && <p className="teacher-error">{error}</p>}
          <div className="teacher-list-items">
            {questionSets.map((questionSet) => (
              <button
                className={`teacher-question-item ${questionSet.id === editingId ? 'active' : ''}`}
                key={questionSet.id}
                onClick={() => startEdit(questionSet)}
                type="button"
              >
                <strong>{questionSet.title}</strong>
                <span>{questionSet.questions.length}문제 · {questionSet.isPublished ? '공개' : '비공개'}</span>
              </button>
            ))}
          </div>
        </aside>

        <form className="teacher-form" onSubmit={handleSubmit}>
          <div className="teacher-form-title">
            <strong>{selectedQuestionSet ? '세트 수정' : '세트 생성'}</strong>
            {selectedQuestionSet && (
              <button className="danger-button" onClick={handleDelete} type="button">삭제</button>
            )}
          </div>

          <label className="answer-field">
            <span>세트 제목</span>
            <input value={formQuestionSet.title} onChange={(event) => updateField('title', event.target.value)} />
          </label>

          <label className="answer-field">
            <span>설명</span>
            <textarea value={formQuestionSet.description} onChange={(event) => updateField('description', event.target.value)} />
          </label>

          <label className="publish-toggle">
            <input
              checked={formQuestionSet.isPublished}
              onChange={(event) => updateField('isPublished', event.target.checked)}
              type="checkbox"
            />
            학생에게 공개
          </label>

          <div className="set-builder-grid">
            <section className="question-picker">
              <strong>문제 선택</strong>
              <div className="picker-list">
                {questions.map((question) => (
                  <label className="picker-item" key={question.id}>
                    <input
                      checked={formQuestionSet.questions.includes(question.id)}
                      onChange={() => toggleQuestion(question.id)}
                      type="checkbox"
                    />
                    <span>{question.title}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="ordered-questions">
              <strong>출제 순서</strong>
              <div className="ordered-list">
                {formQuestionSet.questions.map((questionId, index) => (
                  <div className="ordered-item" key={questionId}>
                    <span>{index + 1}. {questionMap.get(questionId)?.title ?? questionId}</span>
                    <div>
                      <button className="nav-button mini-button" onClick={() => moveQuestion(questionId, -1)} type="button">위</button>
                      <button className="nav-button mini-button" onClick={() => moveQuestion(questionId, 1)} type="button">아래</button>
                    </div>
                  </div>
                ))}
                {formQuestionSet.questions.length === 0 && <p className="teacher-muted">선택한 문제가 없습니다.</p>}
              </div>
            </section>
          </div>

          <button className="submit-button teacher-save" disabled={status === 'saving'} type="submit">
            {status === 'saving' ? '저장 중...' : selectedQuestionSet ? '세트 저장' : '세트 생성'}
          </button>
        </form>
      </div>
    </section>
  );
}
