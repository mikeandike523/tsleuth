import fs from 'fs';
import path from 'path';
import { dirname, join } from 'path';

import * as ignore from 'ignore';

export const ignoreFactory = (gitignoreRealpath: string) => {
  const parent = dirname(gitignoreRealpath);
  const ig = ignore.default().add(fs.readFileSync(gitignoreRealpath, 'utf8'));
  return (realpathToCheck: string) => {
    const bn = path.basename(realpathToCheck);
    if (bn.toLowerCase().endsWith('.git')) {
      return true;
    }
    const relpath = path.relative(parent, realpathToCheck);
    return ig.ignores(relpath);
  };
};

export const emptyIgnoreFactory = () => (_realpathToCheck: string) => false;

export const collectTSSourceFiles = (dirRealpath: string): string[] => {
  const recursion = function recursion(__dir: string) {
    const collected: string[] = [];
    const gitignoreRealpath = join(__dir, '.gitignore');
    const ignorer = fs.existsSync(gitignoreRealpath)
      ? ignoreFactory(gitignoreRealpath)
      : emptyIgnoreFactory();
    const dirEntriesRealpaths = fs
      .readdirSync(__dir)
      .map((entry) => join(__dir, entry));
    for (const entry of dirEntriesRealpaths) {
      if (ignorer(entry)) {
        continue;
      }

      if (fs.lstatSync(entry).isDirectory()) {
        collected.push(...recursion(entry));
      }
      if (fs.lstatSync(entry).isFile()) {
        collected.push(entry);
      }
    }
    return collected;
  };
  const result = recursion(dirRealpath);
  return result.filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'));
};
