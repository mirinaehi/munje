import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const questionSetsPath = path.join(currentDirectory, '..', 'data', 'questionSets.json');

export async function findAllQuestionSets() {
  const contents = await readFile(questionSetsPath, 'utf8');
  return JSON.parse(contents);
}

export async function findQuestionSetById(id) {
  const questionSets = await findAllQuestionSets();
  return questionSets.find((questionSet) => questionSet.id === id) ?? null;
}
