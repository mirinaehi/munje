import { checkQuestionAnswer, getQuestions } from '../services/questionService.js';

export async function listQuestions(_request, response, next) {
  try {
    response.json(await getQuestions());
  } catch (error) {
    next(error);
  }
}

export async function submitQuestionAnswer(request, response, next) {
  try {
    const { answer } = request.body;

    if (!Number.isInteger(answer)) {
      return response.status(400).json({ message: '선택한 보기 번호가 필요합니다.' });
    }

    const result = await checkQuestionAnswer(request.params.id, answer);

    if (!result) {
      return response.status(404).json({ message: '문제를 찾을 수 없습니다.' });
    }

    response.json(result);
  } catch (error) {
    next(error);
  }
}
