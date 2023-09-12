import path from 'path';
import getCommonPrefix from 'common-prefix';

export function stripExt(filename: string): string {
  if (!filename.includes('.')) return filename;
  return filename.substring(0, filename.lastIndexOf('.'));
}

export function commonPrefix(items: string[]): string | null {
  if (items.length === 0) return null;

  const normalizedItems = items.map((item) => item.replace(/\\/g, '/')); // Ensure all paths use forward slashes
  const prefix = getCommonPrefix(normalizedItems);

  return prefix || null;
}

export function absoluteFilepathListToRootAndRelativeFilepaths(
  absolutePaths: string[]
): {
  root: string;
  relativePaths: string[];
} | null {
  const prefix = commonPrefix(absolutePaths);
  if (prefix === null) return null;
  const _prefix = prefix
    .replace(new RegExp(`^\\${path.sep}+`), '')
    .replace(new RegExp(`\\${path.sep}+$`), '')
    .replace(new RegExp(`\\${path.sep}+`), path.sep);
  return {
    root: prefix,
    relativePaths: absolutePaths.map((absolutePath: string) =>
      path
        .normalize(absolutePath)
        .substring(_prefix.length)
        .replace(new RegExp(`^\\${path.sep}+`), '')
        .replace(new RegExp(`\\${path.sep}+$`), '')
        .replace(new RegExp(`\\${path.sep}+`), path.sep)
    ),
  };
}

/**
 * Describes  a directory structure where null value represents the leaf nodes (files)
 */
export type DirectoryStructure<T extends object | null = null> = {
  [name: string]: DirectoryStructure | T | null;
};

/**
 *
 * Taking in a list of paths that are known to be files, assemble a tree representing the directory structure.
 *
 * @param relativePaths - A list of paths that are known to be files
 * @returns
 */
export function calculateDirectoryStructureFromFiles<
  T extends object | null = null,
>(
  relativePaths: string[],
  callback?: (relativePath: string) => T | null
): DirectoryStructure<T> {
  const cb = callback ?? ((_relativePath: string) => null);
  const cleaned = relativePaths.map((p) =>
    path
      .normalize(p)
      .replace(new RegExp(`^\\${path.sep}+`), '')
      .replace(new RegExp(`\\${path.sep}+$`), '')
      .replace(new RegExp(`\\${path.sep}+`), path.sep)
  );
  const segmentedPaths = cleaned.map((p) => p.split(path.sep));
  const directoryStructure: DirectoryStructure<T> = {};
  for (const segmentedPath of segmentedPaths) {
    if (segmentedPath.length === 0) continue;
    if (segmentedPath.length === 1) {
      directoryStructure[segmentedPath[0]] = null;
    }

    let unwrapped: DirectoryStructure<T> = directoryStructure;

    for (let i = 0; i < segmentedPath.length; i++) {
      if (i < segmentedPath.length - 1) {
        const segment = segmentedPath[i];
        if (typeof unwrapped[segment] === 'undefined') {
          unwrapped[segment] = {};
        }
        if (
          unwrapped[segment] === null ||
          typeof unwrapped[segment] !== 'object'
        ) {
          throw new Error(`Cannot convert leaf node to branch node`);
        }
        unwrapped = unwrapped[segment] as DirectoryStructure<T>;
      }
      if (i === segmentedPath.length - 1) {
        unwrapped[segmentedPath[i]] = cb(segmentedPath.join(path.sep));
      }
    }
  }
  return directoryStructure;
}
