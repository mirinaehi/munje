import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const contextsPath = path.join(currentDirectory, '..', 'data', 'contexts.json');

export async function findAllContexts() {
  const contents = await readFile(contextsPath, 'utf8');
  return JSON.parse(contents);
}

export async function findContextsByIds(ids) {
  const contexts = await findAllContexts();
  const contextMap = new Map(contexts.map((context) => [context.id, context]));

  return ids.map((id) => contextMap.get(id)).filter(Boolean);
}
