import path from 'path';
import fs from 'fs';

/**
 * Thrown when a folder is expected, but another filesystem node type was found.
 */
export class NotADirectoryError extends Error {
  name: string = 'NotADirectoryError';
  constructor(requestedPath: string) {
    const message = `Expected a directory, but found a file or file symlink at ${requestedPath}`;
    super(message);
  }
}

/**
 *
 * Thrown when a file, folder, or symlink is expected but does not exist.
 *
 * @param requestedPath
 * @returns
 */
export class FilesystemNodeNonexistentError extends Error {
  name: string = 'FilesystemNodeNonexistentError';
}

/**
 * Thrown when a symbolic link loop is detected
 */
export class SymbolicLinkLoopError extends Error {
  name: string = 'SymbolikLinkLoopError';
  constructor(requestedPath: string) {
    const message = `Symbolic link loop detected at ${requestedPath}`;
    super(message);
  }
}

/**
 * Check if a given filesystem node exists.
 *
 * @param filepath - The path to examine
 * @param followSymlinks - Whether or not to follow symlinks when examining for existence
 *
 * @returns Whether or not the requested path exists, following symlinks if requested.
 *
 * @throws SymbolikLinkLoopError - Thrown when a symbolic link loop is detected.
 */
export function filesystemNodeExists(
  filepath: string,
  followSymlinks = false
): boolean {
  // The convention throughout the entire project is to call any closure used to hide recursion state from the caller, `inner`
  const inner = (__path: string, pathsSoFar: string[]): boolean => {
    const newPathSoFar = pathsSoFar.concat(__path);
    const resolvedPath = path.resolve(__path);
    if (!fs.existsSync(resolvedPath)) {
      return false;
    }
    if (followSymlinks && fs.lstatSync(resolvedPath).isSymbolicLink()) {
      const pointsTo = fs.readlinkSync(resolvedPath);
      if (pathsSoFar.includes(pointsTo)) {
        throw new SymbolicLinkLoopError(resolvedPath);
      }
      return inner(pointsTo, newPathSoFar);
    }
    return true;
  };

  return inner(filepath, []);
}

/**
 * The types of things that a path can represent
 */
export type FilesystemNodeKind =
  | 'file'
  | 'directory'
  | 'block-device'
  | 'character-device'
  | 'fifo'
  | 'socket'
  | 'generic-symbolic-link'
  | 'file-symbolic-link'
  | 'directory-symbolic-link'
  | 'unknown-or-corrupted';

/**
 * Determines what kind of filesystem node a given path represents.
 */
export function getFilesystemNodeKind(filepath: string): FilesystemNodeKind {
  if (!fs.existsSync(filepath)) {
    throw new FilesystemNodeNonexistentError(filepath);
  }

  const stats = fs.lstatSync(filepath);

  if (stats.isFile()) {
    return 'file';
  }
  if (stats.isDirectory()) {
    return 'directory';
  }
  if (stats.isBlockDevice()) {
    return 'block-device';
  }
  if (stats.isCharacterDevice()) {
    return 'character-device';
  }
  if (stats.isFIFO()) {
    return 'fifo';
  }
  if (stats.isSocket()) {
    return 'socket';
  }
  if (stats.isSymbolicLink()) {
    // On windows, its not common to symlink to a symlink in a context where we really need to know that the link target is a symlink and not just a generic filesystem node. So "follow-all" needed.
    // Not sure about linux
    const target = path.resolve(fs.readlinkSync(filepath));
    if (!fs.existsSync(target)) {
      return 'generic-symbolic-link';
    }
    const targetStats = fs.lstatSync(target);
    if (targetStats.isFile()) {
      return 'file-symbolic-link';
    }
    if (targetStats.isDirectory()) {
      return 'directory-symbolic-link';
    }
    return 'generic-symbolic-link';
  }
  return 'unknown-or-corrupted';
}

/**
 * Follows symlinks to find the final target. Detects circular symbolic links.
 *
 * @param filepath - The initial path to start from.
 * @returns The final resolved path after following all symlinks.
 *
 * @throws SymbolicLinkLoopError - Thrown when a symbolic link loop is detected.
 */
export function followAllSymlinks(filepath: string): string {
  const visitedPaths = new Set<string>();

  let currentPath = filepath;
  while (fs.lstatSync(currentPath).isSymbolicLink()) {
    if (visitedPaths.has(currentPath)) {
      throw new SymbolicLinkLoopError(currentPath);
    }

    visitedPaths.add(currentPath);
    currentPath = path.resolve(
      path.dirname(currentPath),
      fs.readlinkSync(currentPath)
    );
  }

  return currentPath;
}

/**
 * The output of the analysis of a given path
 */
export type PathAnalysis = {
  requested: string;
  resolved: string;
  afterSymlinks: string;
  exists: boolean;
  afterSymlinksExists: boolean;
  kind?: FilesystemNodeKind;
  afterSymlinksKind?: FilesystemNodeKind;
};

export function analyzePath(filepath: string): PathAnalysis {
  // Step 1. Resolve the path
  const resolved = path.resolve(filepath);

  // Step 2. Check if the item exists, but dont follow symlinks
  if (!fs.existsSync(resolved)) {
    return {
      requested: filepath,
      resolved: resolved,
      afterSymlinks: resolved,
      exists: false,
      afterSymlinksExists: false,
    };
  }

  // Step 3. Follow all symlinks
  const afterSymlinks = followAllSymlinks(resolved);

  // Step 4. Check for existence after symlinks
  if (!fs.existsSync(afterSymlinks)) {
    return {
      exists: false,
      afterSymlinksExists: false,
      requested: filepath,
      resolved: resolved,
      afterSymlinks: afterSymlinks,
    };
  }

  const kind = getFilesystemNodeKind(resolved);
  const afterSymlinksKind = getFilesystemNodeKind(afterSymlinks);
  return {
    requested: filepath,
    resolved: resolved,
    afterSymlinks: afterSymlinks,
    exists: true,
    afterSymlinksExists: true,
    kind: kind,
    afterSymlinksKind: afterSymlinksKind,
  };
}

export function directoryIsEmpty(
  directoryPath: string,
  followSymlinks = true
): boolean {
  const analysis = analyzePath(directoryPath);
  if (!analysis.exists || (followSymlinks && !analysis.afterSymlinksExists)) {
    throw new FilesystemNodeNonexistentError(directoryPath);
  }
  if (analysis.afterSymlinksKind !== 'directory') {
    throw new NotADirectoryError(directoryPath);
  }
  const target = followSymlinks ? analysis.afterSymlinks : analysis.resolved;
  return fs.readdirSync(target).length === 0;
}

export class DirectoryNotEmptyError extends Error {
  name: string = 'DirectoryNotEmptyError';
  constructor(directoryPath: string) {
    const message = `Directory ${directoryPath} is not empty`;
    super(message);
  }
}

export function removeDirectoryNonRecursive(
  path: string,
  followSymlinks = true
) {
  // The error conditions are the same as directoryIsEmpty, so just call it
  const isEmpty = directoryIsEmpty(path, followSymlinks);
  if (isEmpty) {
    const target = followSymlinks ? path : followAllSymlinks(path);
    fs.rmdirSync(target);
    return;
  } else {
    throw new DirectoryNotEmptyError(path);
  }
}

export class KindUnsupportedError extends Error {
  name: string = 'KindUnsupportedError';
  constructor(kind?: FilesystemNodeKind) {
    const message = `Filesystem node kind ${kind} is not supported`;
    super(message);
  }
}

export function removeFileOrSymlink(path: string, followSymlinks = true) {
  const analysis = analyzePath(path);
  if (!analysis.exists || (followSymlinks && !analysis.afterSymlinksExists)) {
    throw new FilesystemNodeNonexistentError(path);
  }
  let kind: FilesystemNodeKind | undefined = analysis.kind;
  if (followSymlinks) {
    kind = analysis.afterSymlinksKind;
  }
  switch (kind) {
    case 'file':
      fs.unlinkSync(path);
      return;
    case 'generic-symbolic-link':
    case 'file-symbolic-link':
    case 'directory-symbolic-link':
      if (followSymlinks) {
        removeFileOrSymlink(analysis.afterSymlinks, followSymlinks);
        return;
      } else {
        fs.unlinkSync(path);
        return;
      }
  }
  throw new KindUnsupportedError(kind);
}

export function removeDirectoryRecursive(
  directoryPath: string,
  followSymlinks = true
) {
  const analysis = analyzePath(directoryPath);
  if (!analysis.exists || (followSymlinks && !analysis.afterSymlinksExists)) {
    throw new FilesystemNodeNonexistentError(directoryPath);
  }
  if (followSymlinks) {
    if (analysis.afterSymlinksKind !== 'directory') {
      throw new NotADirectoryError(directoryPath);
    }
  } else {
    if (analysis.kind !== 'directory') {
      throw new NotADirectoryError(directoryPath);
    }
  }
  const target = followSymlinks ? analysis.afterSymlinks : analysis.resolved;
  const files = fs.readdirSync(target);

  for (const file of files) {
    // Assume existence since we did readdirSync. In the future might need to handle the error better
    const filepath = path.resolve(target, file);
    const fileAnalysis = analyzePath(filepath);
    const kind = followSymlinks
      ? fileAnalysis.afterSymlinksKind
      : fileAnalysis.kind;
    const fileTarget = followSymlinks
      ? fileAnalysis.afterSymlinks
      : fileAnalysis.resolved;
    switch (kind) {
      case 'file':
      case 'file-symbolic-link':
      case 'directory-symbolic-link':
      case 'generic-symbolic-link':
        removeFileOrSymlink(filepath, followSymlinks);
        break;
      case 'directory':
        if (directoryIsEmpty(fileTarget, followSymlinks)) {
          removeDirectoryNonRecursive(filepath, followSymlinks);
        } else {
          removeDirectoryRecursive(filepath, followSymlinks);
        }
        break;
      default:
        throw new KindUnsupportedError(kind);
    }
  }
  if (directoryIsEmpty(target, followSymlinks)) {
    removeDirectoryNonRecursive(target, followSymlinks);
  }
}

/**
 * A class that does some basic encapsulation over having a "root" directory and relative paths to different directories and files. Prettier code than constantly writing `path.resolve(root, ...)`
 *
 * Warning! This class is tied to the filesystem governed by `process`, it does not operate on abstract/raw strings. For instance, it is not suitable for use when building paths on a remote server.
 */
export class WorkingDirectory {
  /**
   * The working directory to build paths from
   */
  root: string;

  /**
   *
   * Create a new `WorkingDirectory` instance from a path. It is best if `root` is already an absolute path.
   *
   * @param root - The path to the directory from which to build further paths. Defaults to calling `process.cwd()`
   * @remarks
   * `path.resolve` is called on `root`. It is not recommended to pass in a relative path to the constructor as this might be confusing with unpredictable `process.cwd()` behavior.
   */
  constructor(root?: string) {
    root = root ?? process.cwd();
    this.root = path.resolve(root);
  }

  /**
   *
   * Build a new path which is relative to `this.root`
   *
   * @param pathSegments
   * @returns
   */
  resolve(...pathSegments: string[]): string {
    return path.resolve(this.root, ...pathSegments);
  }

  subDir(...pathSegments: string[]): WorkingDirectory {
    const resolved = this.resolve(...pathSegments);
    if (!filesystemNodeExists(resolved, true)) {
      fs.mkdirSync(resolved, { recursive: true });
    } else if (!fs.statSync(resolved).isDirectory()) {
      throw new NotADirectoryError(resolved);
    }
    return new WorkingDirectory(resolved);
  }

  createSelfIfNotExists(): WorkingDirectory {
    const analysis = analyzePath(this.root);
    if (!analysis.exists) {
      fs.mkdirSync(this.root, { recursive: true });
    } else if (!analysis.afterSymlinksExists) {
      fs.mkdirSync(analysis.afterSymlinks, { recursive: true });
    } else {
      if (analysis.kind !== 'directory') {
        throw new NotADirectoryError(analysis.afterSymlinks);
      }
    }
    return this;
  }

  clear(): WorkingDirectory {
    if (filesystemNodeExists(this.root, true)) {
      removeDirectoryRecursive(this.root, true);
      this.createSelfIfNotExists();
    }
    return this;
  }
}

export function readUtf8OrNull(
  filepath: string,
  followSymlinks = true
): string | null {
  const analysis = analyzePath(filepath);
  if (!analysis.exists || (followSymlinks && !analysis.afterSymlinksExists)) {
    return null;
  }
  const kind = followSymlinks ? analysis.afterSymlinksKind : analysis.kind;
  if (kind !== 'file') {
    throw new KindUnsupportedError(kind);
  }
  const target = followSymlinks ? analysis.afterSymlinks : analysis.resolved;
  const content = fs.readFileSync(target, { encoding: 'utf8' });
  return content;
}

export function normalizePath(filepath: string, sep = '/'): string {
  return filepath
    .replace(/\\/g, sep)
    .replace(/\/\//g, sep)
    .replace(/\/+/g, sep)
    .replace(/\\+/g, sep)
    .replace(/^\//g, '')
    .replace(/\/$/g, '')
    .replace(/^\\/g, '')
    .replace(/\\$/g, '');
}

export function pathsStringsAreEquivalent(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

export function copyDirectoryContentsRecursive(
  a: string,
  b: string,
  followSymlinks = true
) {
  const analysisA = analyzePath(a);
  const analysisB = analyzePath(b);
  if (!analysisA.exists || (followSymlinks && !analysisA.afterSymlinksExists)) {
    throw new FilesystemNodeNonexistentError(a);
  }
  const kindA = followSymlinks ? analysisA.afterSymlinksKind : analysisA.kind;
  const kindB = followSymlinks ? analysisB.afterSymlinksKind : analysisB.kind;
  if (kindA !== 'directory') {
    throw new KindUnsupportedError(kindA);
  }
  if (kindB !== 'directory') {
    throw new KindUnsupportedError(kindB);
  }
  const targetA = followSymlinks ? analysisA.afterSymlinks : analysisA.resolved;
  const targetB = followSymlinks ? analysisB.afterSymlinks : analysisB.resolved;
  const filesA = fs.readdirSync(targetA);
  for (const file of filesA) {
    const fullPath = path.resolve(targetA, file);
    const fileAnalysis = analyzePath(fullPath);
    const kind = followSymlinks
      ? fileAnalysis.afterSymlinksKind
      : fileAnalysis.kind;
    const targetDir = path.resolve(targetB, file);
    const targetDirAnalysis = analyzePath(targetDir);
    const doesNotExist =
      !targetDirAnalysis.exists ||
      (followSymlinks && !targetDirAnalysis.afterSymlinksExists);
    switch (kind) {
      case 'file':
      case 'file-symbolic-link':
      case 'directory-symbolic-link':
      case 'generic-symbolic-link':
        fs.copyFileSync(fullPath, path.resolve(targetB, file));
        break;
      case 'directory':
        if (doesNotExist) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        copyDirectoryContentsRecursive(fullPath, targetDir, followSymlinks);
        break;
    }
  }
}
