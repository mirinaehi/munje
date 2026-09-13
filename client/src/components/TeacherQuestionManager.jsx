import { useMemo, useState } from 'react';

const emptyQuestion = {
  title: '',
  content: '',
  unit: '',
  difficulty: 'easy',
  score: 5,
  choicesText: '보기 1\n보기 2\n보기 3\n보기 4',
  answer: 0,
  explanation: '',
};

function toFormQuestion(question) {
  return {
    title: question.title ?? '',
    content: question.content ?? '',
    unit: question.unit ?? '',
    difficulty: question.difficulty ?? 'easy',
    score: question.score ?? 5,
    choicesText: (question.choices ?? []).join('\n'),
    answer: question.answer ?? 0,
    explanation: question.explanation ?? '',
  };
}

function toPayload(formQuestion) {
  return {
    title: formQuestion.title,
    content: formQuestion.content,
    unit: formQuestion.unit,
    difficulty: formQuestion.difficulty,
    score: Number(formQuestion.score),
    choices: formQuestion.choicesText.split('\n'),
    answer: Number(formQuestion.answer),
    explanation: formQuestion.explanation,
  };
}

export default function TeacherQuestionManager({
  questions,
  status,
  error,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [formQuestion, setFormQuestion] = useState(emptyQuestion);
  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === editingId) ?? null,
    [editingId, questions],
  );

  function updateField(field, value) {
    setFormQuestion((current) => ({ ...current, [field]: value }));
  }

  function startEdit(question) {
    setEditingId(question.id);
    setFormQuestion(toFormQuestion(question));
  }

  function resetForm() {
    setEditingId(null);
    setFormQuestion(emptyQuestion);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = toPayload(formQuestion);

    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate(payload);
    }

    resetForm();
  }

  async function handleDelete() {
    if (!selectedQuestion) return;

    await onDelete(selectedQuestion.id);
    resetForm();
  }

  return (
    <section className="teacher-manager" aria-label="교사용 문제 관리">
      <div className="teacher-manager-heading">
        <div>
          <p className="eyebrow">TEACHER TOOLS</p>
          <h2>문제 관리</h2>
          <p>객관식 문제를 만들고 수정한 뒤 학생 풀이 흐름에 반영할 수 있어요.</p>
        </div>
        <button className="nav-button" onClick={resetForm} type="button">새 문제</button>
      </div>

      <div className="teacher-grid">
        <aside className="teacher-question-list">
          <div className="list-heading">
            <span>전체 문제</span>
            <strong>{questions.length}</strong>
          </div>
          {status === 'loading' && <p className="teacher-muted">문제를 불러오고 있어요.</p>}
          {error && <p className="teacher-error">{error}</p>}
          <div className="teacher-list-items">
            {questions.map((question) => (
              <button
                className={`teacher-question-item ${question.id === editingId ? 'active' : ''}`}
                key={question.id}
                onClick={() => startEdit(question)}
                type="button"
              >
                <strong>{question.title}</strong>
                <span>{question.unit} · {question.score}점</span>
              </button>
            ))}
          </div>
        </aside>

        <form className="teacher-form" onSubmit={handleSubmit}>
          <div className="teacher-form-title">
            <strong>{selectedQuestion ? '문제 수정' : '문제 생성'}</strong>
            {selectedQuestion && (
              <button className="danger-button" onClick={handleDelete} type="button">
                삭제
              </button>
            )}
          </div>

          <label className="answer-field">
            <span>제목</span>
            <input value={formQuestion.title} onChange={(event) => updateField('title', event.target.value)} />
          </label>

          <label className="answer-field">
            <span>문제 내용</span>
            <textarea value={formQuestion.content} onChange={(event) => updateField('content', event.target.value)} />
          </label>

          <div className="teacher-form-row">
            <label className="answer-field">
              <span>단원</span>
              <input value={formQuestion.unit} onChange={(event) => updateField('unit', event.target.value)} />
            </label>
            <label className="answer-field">
              <span>배점</span>
              <input min="1" type="number" value={formQuestion.score} onChange={(event) => updateField('score', event.target.value)} />
            </label>
            <label className="answer-field">
              <span>난이도</span>
              <select value={formQuestion.difficulty} onChange={(event) => updateField('difficulty', event.target.value)}>
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </label>
          </div>

          <label className="answer-field">
            <span>보기 목록</span>
            <textarea value={formQuestion.choicesText} onChange={(event) => updateField('choicesText', event.target.value)} />
          </label>

          <label className="answer-field">
            <span>정답 번호 (0부터)</span>
            <input min="0" type="number" value={formQuestion.answer} onChange={(event) => updateField('answer', event.target.value)} />
          </label>

          <label className="answer-field">
            <span>해설</span>
            <textarea value={formQuestion.explanation} onChange={(event) => updateField('explanation', event.target.value)} />
          </label>

          <button className="submit-button teacher-save" disabled={status === 'saving'} type="submit">
            {status === 'saving' ? '저장 중...' : selectedQuestion ? '수정 저장' : '문제 생성'}
          </button>
        </form>
      </div>
    </section>
  );
}
