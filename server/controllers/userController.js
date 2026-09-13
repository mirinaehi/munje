import { getCurrentUser, getUsers } from '../services/userService.js';

export async function listUsers(_request, response, next) {
  try {
    response.json(await getUsers());
  } catch (error) {
    next(error);
  }
}

export async function showCurrentUser(request, response, next) {
  try {
    const user = await getCurrentUser(request.query.userId);

    if (!user) {
      return response.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    response.json(user);
  } catch (error) {
    next(error);
  }
}
