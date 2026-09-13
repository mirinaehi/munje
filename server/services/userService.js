import { findAllUsers, findUserById } from '../repositories/userRepository.js';

const defaultUserId = 'student-minseo';

export function toPublicUser(user) {
  const { email, ...publicUser } = user;
  return publicUser;
}

export async function getUsers() {
  const users = await findAllUsers();
  return users.map(toPublicUser);
}

export async function getCurrentUser(userId = defaultUserId) {
  const user = await findUserById(userId);
  return user ? toPublicUser(user) : null;
}

export async function getRequiredUser(userId = defaultUserId) {
  return findUserById(userId);
}
