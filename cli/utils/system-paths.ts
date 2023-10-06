import path from 'path';

import {
  WorkingDirectory,
  normalizePath,
  pathsStringsAreEquivalent,
  readUtf8OrNull,
} from '@common/filesystem';
import { normalizeLineEndings } from '@common/text';

/**
 * Neatly encapsulates access to all of the relevant folders for the "tsleuth" cli application
 */
export class TsleuthDirectory extends WorkingDirectory {
  /**
   * Determines where the ".tsleuth" folder shoud be and constructs a new `TsleuthDirectory` instance from it.
   *
   * The design pattern of the cli application is to store all of its data in a hidden folder called ".tsleuth" in the current working directory.
   *
   * The use calls "tsleuth" from the directory containing their project, and the cli application procedes to operate in that folder
   */
  constructor() {
    const cwd = process.cwd();
    const tsleuthDir = path.resolve(cwd, '.tsleuth');
    super(tsleuthDir);
    this.createSelfIfNotExists();
  }

  createSelfIfNotExists(): TsleuthDirectory {
    super.createSelfIfNotExists();
    return this;
  }

  featureDir(featureName: string) {
    return this.subDir('features')
      .createSelfIfNotExists()
      .subDir(featureName)
      .createSelfIfNotExists();
  }

  containingDirectoryPath() {
    return this.resolve('..');
  }

  isInGitignore() {
    const gitignorePath = path.resolve(
      this.containingDirectoryPath(),
      '.gitignore',
    );
    const content = normalizeLineEndings(
      readUtf8OrNull(gitignorePath) ?? '',
      '\n',
    );
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('!')) {
        continue;
      }
      const cleanLine = normalizePath(
        line.replace(/^\s+/g, '').replace(/\s+$/g, '/'),
      )
        .replace(/^\/+/g, '')
        .replace(/\/+$/g, '');

      // Good enough for now, should cover most glob patterns
      // Fails for really complex stuff like the file extension globs
      // But why is user ignoring only certain file extensions in a custom hidden folder for a cli app?
      // May need to be improved in the future
      if (cleanLine.startsWith('.tsleuth')) {
        return true;
      }
    }
    return false;
  }
}
