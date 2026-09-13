export async function checkApiHealth() {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error('API health check failed');
  }

  return response.json();
}

async function parseResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '요청을 처리하지 못했습니다.');
  }

  return data;
}

export async function getQuestions() {
  const response = await fetch('/api/questions');
  return parseResponse(response);
}

export async function getQuestionSets() {
  const response = await fetch('/api/question-sets');
  return parseResponse(response);
}

export async function getQuestionSet(questionSetId) {
  const response = await fetch(`/api/question-sets/${questionSetId}`);
  return parseResponse(response);
}

export async function submitAnswer(questionId, answer) {
  const response = await fetch(`/api/questions/${questionId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });

  return parseResponse(response);
}
