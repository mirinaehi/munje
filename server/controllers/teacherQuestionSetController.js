import {
  createTeacherQuestionSet,
  deleteTeacherQuestionSet,
  getTeacherQuestionSets,
  updateTeacherQuestionSet,
} from '../services/teacherQuestionSetService.js';

function sendResult(response, result, successStatus = 200) {
  if (result.error) return response.status(result.error.status).json({ message: result.error.message });
  return response.status(successStatus).json(result);
}

export async function listTeacherQuestionSets(request, response, next) {
  try {
    sendResult(response, await getTeacherQuestionSets(request.query.userId));
  } catch (error) {
    next(error);
  }
}

export async function createQuestionSet(request, response, next) {
  try {
    sendResult(response, await createTeacherQuestionSet(request.body.userId, request.body.questionSet), 201);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestionSet(request, response, next) {
  try {
    sendResult(response, await updateTeacherQuestionSet(request.body.userId, request.params.id, request.body.questionSet));
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestionSet(request, response, next) {
  try {
    sendResult(response, await deleteTeacherQuestionSet(request.body.userId, request.params.id));
  } catch (error) {
    next(error);
  }
}
