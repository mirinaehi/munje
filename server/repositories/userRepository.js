import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const usersPath = path.join(currentDirectory, '..', 'data', 'users.json');

export async function findAllUsers() {
  const contents = await readFile(usersPath, 'utf8');
  return JSON.parse(contents);
}

export async function findUserById(id) {
  const users = await findAllUsers();
  return users.find((user) => user.id === id) ?? null;
}
