import fs from 'fs';
import path from 'path';
export function findReadmeInFolder(folder: string): string | null {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    if (
      file.toLowerCase().includes('readme') &&
      (file.toLowerCase().endsWith('.md') ||
        file.toLowerCase().endsWith('.txt'))
    ) {
      return path.resolve(folder, file);
    }
  }
  return null;
}
