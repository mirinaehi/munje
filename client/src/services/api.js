const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

function apiUrl(path) {
  return `${apiBaseUrl}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const fallbackText = await response.text();
    const message = fallbackText.trim().slice(0, 120) || '빈 응답';

    throw new Error(`API가 JSON을 반환하지 않았습니다. 배포 환경의 API 주소를 확인하세요. 응답: ${message}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '요청을 처리하지 못했습니다.');
  }

  return data;
}

export async function checkApiHealth() {
  const response = await fetch(apiUrl('/api/health'));
  return parseResponse(response);
}

export async function getQuestions() {
  const response = await fetch(apiUrl('/api/questions'));
  return parseResponse(response);
}

export async function getQuestionSets(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const response = await fetch(apiUrl(`/api/question-sets${query}`));
  return parseResponse(response);
}

export async function getQuestionSet(questionSetId, userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const response = await fetch(apiUrl(`/api/question-sets/${questionSetId}${query}`));
  return parseResponse(response);
}

export async function getUsers() {
  const response = await fetch(apiUrl('/api/users'));
  return parseResponse(response);
}

export async function getCurrentUser(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const response = await fetch(apiUrl(`/api/users/current${query}`));
  return parseResponse(response);
}

export async function submitAnswer(questionId, answer) {
  const response = await fetch(apiUrl(`/api/questions/${questionId}/check`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });

  return parseResponse(response);
}

export async function submitQuestionSet({ userId, questionSetId, answers }) {
  const response = await fetch(apiUrl('/api/submissions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionSetId, answers }),
  });

  return parseResponse(response);
}

export async function getTeacherQuestions(userId) {
  const response = await fetch(apiUrl(`/api/teacher/questions?userId=${encodeURIComponent(userId)}`));
  return parseResponse(response);
}

export async function createTeacherQuestion(userId, question) {
  const response = await fetch(apiUrl('/api/teacher/questions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, question }),
  });

  return parseResponse(response);
}

export async function updateTeacherQuestion(userId, questionId, question) {
  const response = await fetch(apiUrl(`/api/teacher/questions/${questionId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, question }),
  });

  return parseResponse(response);
}

export async function deleteTeacherQuestion(userId, questionId) {
  const response = await fetch(apiUrl(`/api/teacher/questions/${questionId}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  return parseResponse(response);
}

export async function getTeacherQuestionSets(userId) {
  const response = await fetch(apiUrl(`/api/teacher/question-sets?userId=${encodeURIComponent(userId)}`));
  return parseResponse(response);
}

export async function createTeacherQuestionSet(userId, questionSet) {
  const response = await fetch(apiUrl('/api/teacher/question-sets'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionSet }),
  });

  return parseResponse(response);
}

export async function updateTeacherQuestionSet(userId, questionSetId, questionSet) {
  const response = await fetch(apiUrl(`/api/teacher/question-sets/${questionSetId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionSet }),
  });

  return parseResponse(response);
}

export async function deleteTeacherQuestionSet(userId, questionSetId) {
  const response = await fetch(apiUrl(`/api/teacher/question-sets/${questionSetId}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  return parseResponse(response);
}

export async function getTeacherAssignments(userId) {
  const response = await fetch(apiUrl(`/api/teacher/assignments?userId=${encodeURIComponent(userId)}`));
  return parseResponse(response);
}

export async function updateTeacherAssignment(userId, studentId, questionSetIds) {
  const response = await fetch(apiUrl(`/api/teacher/assignments/${studentId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionSetIds }),
  });

  return parseResponse(response);
}

export async function getLearningAnalytics(userId) {
  const response = await fetch(apiUrl(`/api/analytics?userId=${encodeURIComponent(userId)}`));
  return parseResponse(response);
}

export async function getStudentLearningAnalytics(userId) {
  const response = await fetch(apiUrl(`/api/analytics/student?userId=${encodeURIComponent(userId)}`));
  return parseResponse(response);
}
