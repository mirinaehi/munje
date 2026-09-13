import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const questionsPath = path.join(currentDirectory, '..', 'data', 'questions.json');

export async function findAllQuestions() {
  const contents = await readFile(questionsPath, 'utf8');
  return JSON.parse(contents);
}

export async function findQuestionById(id) {
  const questions = await findAllQuestions();
  return questions.find((question) => question.id === id) ?? null;
}
