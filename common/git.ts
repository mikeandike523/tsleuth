import fs from 'fs';
import path from 'path';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

// After testing, found out that this is not robust enough and we need logic that traverses parent directories searching for gitignores

// import * as ignore from 'ignore';
// export const ignoreFactory = (gitignoreRealpath: string) => {
//   const parent = dirname(gitignoreRealpath);
//   const ig = ignore.default().add(fs.readFileSync(gitignoreRealpath, 'utf8'));
//   return (realpathToCheck: string) => {
//     const bn = path.basename(realpathToCheck);
//     if (bn.toLowerCase().endsWith('.git')) {
//       return true;
//     }
//     const relpath = path.relative(parent, realpathToCheck);
//     return ig.ignores(relpath);
//   };
// };
// export const emptyIgnoreFactory = () => (_realpathToCheck: string) => false;
// export const collectTSSourceFiles = (dirRealpath: string): string[] => {
//   const recursion = function recursion(__dir: string) {
//     const collected: string[] = [];
//     const gitignoreRealpath = join(__dir, '.gitignore');
//     const ignorer = fs.existsSync(gitignoreRealpath)
//       ? ignoreFactory(gitignoreRealpath)
//       : emptyIgnoreFactory();
//     const dirEntriesRealpaths = fs
//       .readdirSync(__dir)
//       .map((entry) => join(__dir, entry));
//     for (const entry of dirEntriesRealpaths) {
//       if (ignorer(entry)) {
//         continue;
//       }
//       if (fs.lstatSync(entry).isDirectory()) {
//         collected.push(...recursion(entry));
//       }
//       if (fs.lstatSync(entry).isFile()) {
//         collected.push(entry);
//       }
//     }
//     return collected;
//   };
//   const result = recursion(dirRealpath);
//   return result.filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'));
// };

// I am too lazy to reimplement using typescript, so I just call another project I made
// See https://github.com/mikeandike523/gitsleuth

export function collectIncludedFiles(dirRealpath: string): string[] {
  const options = {
    cwd: dirRealpath,
  };
  const lines = execSync('cmd /C gitsleuth source-tree list-included', options)
    .toString()
    .trim()
    .split('\n');
  return lines.map((line) => {
    return path.join(path.normalize(dirRealpath), path.normalize(line.trim()));
  });
}

export function collectTSSourceFiles(dirRealpath: string): string[] {
  return collectIncludedFiles(dirRealpath).filter(
    (p) => p.endsWith('.ts') || p.endsWith('.tsx')
  );
}
