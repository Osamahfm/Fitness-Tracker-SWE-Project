import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'fitness-tracker-db.json');

const defaultDb = {
  users: [],
  sessions: [],
  activities: [],
  alarms: [],
  uatSignoffs: [],
  monitoringEvents: [
    {
      id: 1,
      type: "startup",
      message: "Monitoring initialized",
      createdAt: new Date().toISOString()
    }
  ]
};

export async function readDb() {
  await mkdir(dataDir, { recursive: true });

  try {
    const text = await readFile(dbPath, 'utf8');
    return { ...defaultDb, ...JSON.parse(text) };
  } catch {
    await writeDb(defaultDb);
    return structuredClone(defaultDb);
  }
}

export async function writeDb(db) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

export async function updateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}
