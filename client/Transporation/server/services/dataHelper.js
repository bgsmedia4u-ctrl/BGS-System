import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

export function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = filePath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}
