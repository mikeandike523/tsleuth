import fs from 'fs';
import path from 'path';

export type OverviewEntry = {
  uuidInSourceFile: string;
  filesystemPathSegments: string[];
  symbolPathSegments: string[];
};

export type Overview = Array<OverviewEntry>;

export function getOverviewFromCacheDir(docsCacheDir: string): Overview {
  const overviewPath = path.join(docsCacheDir, 'misc', 'overview.json');
  if (!fs.existsSync(overviewPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(overviewPath, 'utf8'));
}
