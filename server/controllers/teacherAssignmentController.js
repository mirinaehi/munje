import { getTeacherAssignments, updateTeacherAssignment } from '../services/teacherAssignmentService.js';

function sendResult(response, result) {
  if (result.error) return response.status(result.error.status).json({ message: result.error.message });
  return response.json(result);
}

export async function listTeacherAssignments(request, response, next) {
  try {
    sendResult(response, await getTeacherAssignments(request.query.userId));
  } catch (error) {
    next(error);
  }
}

export async function updateAssignment(request, response, next) {
  try {
    sendResult(
      response,
      await updateTeacherAssignment(request.body.userId, request.params.studentId, request.body.questionSetIds),
    );
  } catch (error) {
    next(error);
  }
}
