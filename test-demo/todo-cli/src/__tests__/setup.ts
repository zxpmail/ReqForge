import { beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let storageFile = '';

beforeEach(() => {
  storageFile = path.join(os.tmpdir(), `todo-test-${process.pid}-${Date.now()}.json`);
  process.env.TODO_STORAGE_FILE = storageFile;
  if (fs.existsSync(storageFile)) {
    fs.unlinkSync(storageFile);
  }
});

afterEach(() => {
  if (storageFile && fs.existsSync(storageFile)) {
    fs.unlinkSync(storageFile);
  }
  delete process.env.TODO_STORAGE_FILE;
});
