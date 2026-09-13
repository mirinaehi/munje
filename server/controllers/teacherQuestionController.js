import {
  createTeacherQuestion,
  deleteTeacherQuestion,
  getTeacherQuestions,
  updateTeacherQuestion,
} from '../services/teacherQuestionService.js';

function sendResult(response, result, successStatus = 200) {
  if (result.error) {
    return response.status(result.error.status).json({ message: result.error.message });
  }

  return response.status(successStatus).json(result);
}

export async function listTeacherQuestions(request, response, next) {
  try {
    sendResult(response, await getTeacherQuestions(request.query.userId));
  } catch (error) {
    next(error);
  }
}

export async function createQuestion(request, response, next) {
  try {
    sendResult(response, await createTeacherQuestion(request.body.userId, request.body.question), 201);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(request, response, next) {
  try {
    sendResult(response, await updateTeacherQuestion(request.body.userId, request.params.id, request.body.question));
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(request, response, next) {
  try {
    sendResult(response, await deleteTeacherQuestion(request.body.userId, request.params.id));
  } catch (error) {
    next(error);
  }
}
