import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultSubmissionsPath = path.join(currentDirectory, '..', 'data', 'submissions.json');
let runtimeSubmissionsPath = null;

function getSubmissionsPath() {
  return process.env.MUNJE_SUBMISSIONS_PATH || runtimeSubmissionsPath || defaultSubmissionsPath;
}

function canFallbackToRuntimeFile(error) {
  return ['EACCES', 'ENOENT', 'EROFS', 'EPERM'].includes(error.code);
}

export async function findAllSubmissions() {
  const contents = await readFile(getSubmissionsPath(), 'utf8');
  return JSON.parse(contents);
}

export async function saveSubmission(submission) {
  const submissions = await findAllSubmissions();
  const nextSubmissions = [...submissions, submission];
  const serializedSubmissions = `${JSON.stringify(nextSubmissions, null, 2)}\n`;

  try {
    await writeFile(getSubmissionsPath(), serializedSubmissions);
  } catch (error) {
    if (process.env.MUNJE_SUBMISSIONS_PATH || !canFallbackToRuntimeFile(error)) {
      throw error;
    }

    runtimeSubmissionsPath = path.join(os.tmpdir(), 'munje-submissions.json');
    await writeFile(runtimeSubmissionsPath, serializedSubmissions);
  }

  return submission;
}
