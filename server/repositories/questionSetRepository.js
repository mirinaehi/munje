import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultQuestionSetsPath = path.join(currentDirectory, '..', 'data', 'questionSets.json');
let runtimeQuestionSetsPath = null;

function getQuestionSetsPath() {
  return process.env.MUNJE_QUESTION_SETS_PATH || runtimeQuestionSetsPath || defaultQuestionSetsPath;
}

function canFallbackToRuntimeFile(error) {
  return ['EACCES', 'ENOENT', 'EROFS', 'EPERM'].includes(error.code);
}

export async function findAllQuestionSets() {
  const contents = await readFile(getQuestionSetsPath(), 'utf8');
  return JSON.parse(contents);
}

export async function findQuestionSetById(id) {
  const questionSets = await findAllQuestionSets();
  return questionSets.find((questionSet) => questionSet.id === id) ?? null;
}

export async function saveAllQuestionSets(questionSets) {
  const serializedQuestionSets = `${JSON.stringify(questionSets, null, 2)}\n`;

  try {
    await writeFile(getQuestionSetsPath(), serializedQuestionSets);
  } catch (error) {
    if (process.env.MUNJE_QUESTION_SETS_PATH || !canFallbackToRuntimeFile(error)) {
      throw error;
    }

    runtimeQuestionSetsPath = path.join(os.tmpdir(), 'munje-question-sets.json');
    await writeFile(runtimeQuestionSetsPath, serializedQuestionSets);
  }

  return questionSets;
}
