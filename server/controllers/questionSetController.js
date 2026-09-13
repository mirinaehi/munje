import { getQuestionSet, getQuestionSets } from '../services/questionSetService.js';

export async function listQuestionSets(_request, response, next) {
  try {
    response.json(await getQuestionSets());
  } catch (error) {
    next(error);
  }
}

export async function showQuestionSet(request, response, next) {
  try {
    const questionSet = await getQuestionSet(request.params.id);

    if (!questionSet) {
      return response.status(404).json({ message: '문제 세트를 찾을 수 없습니다.' });
    }

    response.json(questionSet);
  } catch (error) {
    next(error);
  }
}
