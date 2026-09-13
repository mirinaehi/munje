import { getLearningAnalytics, getStudentLearningAnalytics } from '../services/analyticsService.js';

export async function showLearningAnalytics(request, response, next) {
  try {
    const result = await getLearningAnalytics(request.query.userId);

    if (result.error) {
      return response.status(result.error.status).json({ message: result.error.message });
    }

    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function showStudentLearningAnalytics(request, response, next) {
  try {
    const result = await getStudentLearningAnalytics(request.query.userId);

    if (result.error) {
      return response.status(result.error.status).json({ message: result.error.message });
    }

    response.json(result);
  } catch (error) {
    next(error);
  }
}
