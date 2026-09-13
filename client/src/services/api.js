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

export async function getQuestionSets() {
  const response = await fetch(apiUrl('/api/question-sets'));
  return parseResponse(response);
}

export async function getQuestionSet(questionSetId) {
  const response = await fetch(apiUrl(`/api/question-sets/${questionSetId}`));
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
