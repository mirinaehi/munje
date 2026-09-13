import { createSubmission } from '../services/submissionService.js';

export async function submitQuestionSet(request, response, next) {
  try {
    const result = await createSubmission(request.body);

    if (result.error) {
      return response.status(result.error.status).json({ message: result.error.message });
    }

    response.status(201).json(result.submission);
  } catch (error) {
    next(error);
  }
}
