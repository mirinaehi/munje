import { useMemo, useState } from 'react';

const emptyQuestion = {
  title: '',
  content: '',
  unit: '',
  difficulty: 'easy',
  score: 5,
  choicesText: '보기 1\n보기 2\n보기 3\n보기 4',
  answer: '',
  explanation: '',
};

const circledChoiceMap = new Map([
  ['①', 0],
  ['②', 1],
  ['③', 2],
  ['④', 3],
  ['⑤', 4],
]);

function toFormQuestion(question) {
  return {
    title: question.title ?? '',
    content: question.content ?? '',
    unit: question.unit ?? '',
    difficulty: question.difficulty ?? 'easy',
    score: question.score ?? 5,
    choicesText: (question.choices ?? []).join('\n'),
    answer: question.answer ?? '',
    explanation: question.explanation ?? '',
  };
}

function toPayload(formQuestion) {
  const answer = formQuestion.answer === '' ? null : Number(formQuestion.answer);

  return {
    title: formQuestion.title,
    content: formQuestion.content,
    unit: formQuestion.unit,
    difficulty: formQuestion.difficulty,
    score: Number(formQuestion.score),
    choices: formQuestion.choicesText.split('\n'),
    answer,
    explanation: formQuestion.explanation,
  };
}

function cleanBulkText(text) {
  return text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function findUnit(lines) {
  const heading = [...lines].reverse().find((line) => (
    /^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.\s+/.test(line.trim())
    || /CommonJS|ES Module|Module|모듈/.test(line)
  ));

  return heading?.replace(/^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.\s+/, '').trim() || '가져오기와 내보내기';
}

function parseBulkQuestions(text) {
  const source = cleanBulkText(text);
  const questionPattern = /(^|\n)(\d{1,2})\.\s+([^\n]+)/g;
  const matches = [...source.matchAll(questionPattern)];

  return matches.map((match, index) => {
    const start = match.index + match[1].length;
    const end = matches[index + 1]?.index ?? source.length;
    const previousText = source.slice(0, start);
    const block = source.slice(start, end).trim();
    const blockLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const title = blockLines[0].replace(/^\d{1,2}\.\s+/, '').trim();
    const choices = [];
    const contentLines = [];

    for (const line of blockLines.slice(1)) {
      const choiceMark = line[0];

      if (circledChoiceMap.has(choiceMark)) {
        choices.push(line.slice(1).trim().replace(/\s+/g, ' '));
      } else if (!line.startsWith('선택지')) {
        contentLines.push(line);
      }
    }

    return {
      title,
      content: contentLines.join('\n').trim() || title,
      unit: findUnit(previousText.split('\n')),
      difficulty: 'medium',
      score: 5,
      choices,
      answer: null,
      explanation: '정답과 해설을 검토한 뒤 수정하세요.',
    };
  }).filter((question) => question.title && question.choices.length >= 2);
}

function isAnswerUndecided(question) {
  return question.answer === null || question.answer === undefined || question.answer === '';
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
  const [bulkText, setBulkText] = useState('');
  const [bulkQuestions, setBulkQuestions] = useState([]);
  const [bulkError, setBulkError] = useState('');
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

  function loadBulkQuestion(question) {
    setEditingId(null);
    setFormQuestion(toFormQuestion(question));
  }

  function convertBulkText() {
    const parsedQuestions = parseBulkQuestions(bulkText);

    if (parsedQuestions.length === 0) {
      setBulkError('문제를 찾지 못했습니다. 번호와 ①②③ 형식의 보기가 있는지 확인하세요.');
      setBulkQuestions([]);
      return;
    }

    setBulkError('');
    setBulkQuestions(parsedQuestions);
  }

  async function saveBulkQuestions() {
    const undecidedCount = bulkQuestions.filter(isAnswerUndecided).length;

    if (undecidedCount > 0) {
      setBulkError(`정답 미정 문제가 ${undecidedCount}개 있습니다. 미리보기에서 문제를 열어 정답을 선택한 뒤 저장하세요.`);
      return;
    }

    for (const question of bulkQuestions) {
      await onCreate(question);
    }

    setBulkText('');
    setBulkQuestions([]);
    setBulkError('');
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

      <section className="bulk-importer" aria-label="문제 붙여넣기 변환">
        <div className="teacher-form-title">
          <strong>통째 붙여넣기 변환</strong>
          <div className="action-group">
            <button className="nav-button" onClick={convertBulkText} type="button">변환</button>
            <button className="submit-button" disabled={bulkQuestions.length === 0 || status === 'saving'} onClick={saveBulkQuestions} type="button">
              {bulkQuestions.length}개 저장
            </button>
          </div>
        </div>
        <label className="answer-field">
          <span>원문</span>
          <textarea
            className="bulk-textarea"
            placeholder="번호가 붙은 객관식 문제 묶음을 그대로 붙여넣으세요."
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
          />
        </label>
        {bulkError && <p className="teacher-error">{bulkError}</p>}
        {bulkQuestions.length > 0 && (
          <div className="bulk-preview">
            {bulkQuestions.map((question, index) => (
              <article className="bulk-preview-item" key={`${question.title}-${index}`}>
                <button onClick={() => loadBulkQuestion(question)} type="button">
                  <strong>{index + 1}. {question.title}</strong>
                  <span>{question.unit} · 보기 {question.choices.length}개</span>
                </button>
                <span className={isAnswerUndecided(question) ? 'answer-status undecided' : 'answer-status decided'}>
                  {isAnswerUndecided(question) ? '정답 미정' : `정답 ${question.answer + 1}번`}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

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
            <span>정답 번호</span>
            <select value={formQuestion.answer} onChange={(event) => updateField('answer', event.target.value)}>
              <option value="">미정</option>
              {formQuestion.choicesText.split('\n').filter((choice) => choice.trim()).map((choice, index) => (
                <option key={`${choice}-${index}`} value={index}>{index + 1}번</option>
              ))}
            </select>
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
