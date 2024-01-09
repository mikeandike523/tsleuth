/**
 * A collection of regex utilities
 *
 * Inspired by python's re module, which is much more robust in my opinion
 */

/**
 * Escapes special characters in a string to be used safely within a regular expression.
 *
 * @param unsafe - The string to be escaped.
 * @returns The escaped string, safe for use in regular expressions.
 */
export function escapeRegExp(unsafe: string): string {
  return unsafe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a copy of a RegExp object.
 *
 * @param pattern - The regular expression to be copied.
 * @returns A new RegExp object with the same pattern and flags as the input.
 */
export function copyRegExp(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags);
}

/**
 * Copies a RegExp object and ensures that the 'global' flag is set.
 *
 * @param pattern - The regular expression to be copied.
 * @returns A new RegExp object with the same pattern as the input and the 'global' flag set.
 */
export function copyAndEnforceGlobalRegExp(pattern: RegExp): RegExp {
  let existingFlags = pattern.flags;
  if (!existingFlags.includes('g')) {
    existingFlags += 'g';
  }
  return new RegExp(pattern.source, existingFlags);
}

/**
 * Checks if a given string contains any match for the specified regular expression pattern.
 *
 * @param pattern - The regular expression pattern to test against.
 * @param string - The string to be tested.
 * @returns `true` if any match is found, otherwise `false`.
 */
export function hasAnyMatch(pattern: RegExp, string: string): boolean {
  const patternCopy = copyAndEnforceGlobalRegExp(pattern);
  return patternCopy.test(string);
}

/**
 * Splits a string into segments based on a regular expression pattern.
 *
 * @param text - The string to be split.
 * @param pattern - The regular expression pattern used for splitting.
 * @param includeSeparators - Whether to include the separators in the result.
 * @returns An array of string segments.
 */
export function separateByRegExp(
  text: string,
  pattern: RegExp,
  includeSeparators: boolean = false
): Array<string> {
  if (text.length === 0) {
    return [text];
  }
  if (!hasAnyMatch(pattern, text)) {
    return [text];
  }
  const patternCopy = copyAndEnforceGlobalRegExp(pattern);
  const segments: string[] = [];
  let match: RegExpExecArray | null = null;
  let pointer: number = 0;
  while ((match = patternCopy.exec(text)) !== null) {
    const startPos = match.index;
    const priorText = text.substring(pointer, startPos);
    const matchText = match[0];
    segments.push(priorText);
    if (includeSeparators) {
      segments.push(matchText);
    }
    pointer += priorText.length + matchText.length;
  }
  if (pointer < text.length) {
    segments.push(text.substring(pointer));
  }

  return segments;
}

/**
 * Splits a string into segments based on a regular expression pattern.
 *
 * @param text - The string to be split.
 * @param pattern - The regular expression pattern used for splitting.
 * @param includeSeparators - Whether to include the separators in the result.
 * @returns An array of string segments.
 */
export function separateByRegExpWithIndices(
  text: string,
  pattern: RegExp,
  includeSeparators: boolean = false
): Array<[number, string]> {
  if (text.length === 0) {
    return [[0, text]];
  }
  if (!hasAnyMatch(pattern, text)) {
    return [[0, text]];
  }
  const patternCopy = copyAndEnforceGlobalRegExp(pattern);
  const segments: [number, string][] = [];
  let match: RegExpExecArray | null = null;
  let pointer: number = 0;
  while ((match = patternCopy.exec(text)) !== null) {
    const startPos = match.index;
    const priorText = text.substring(pointer, startPos);
    const matchText = match[0];
    segments.push([pointer, priorText]);
    if (includeSeparators) {
      segments.push([pointer + priorText.length, matchText]);
    }
    pointer += priorText.length + matchText.length;
  }
  if (pointer < text.length) {
    segments.push([pointer, text.substring(pointer)]);
  }

  return segments;
}

export function separateByRegExpWithTyping(
  text: string,
  pattern: RegExp,
  includeSeparators: boolean = false
): Array<{
  kind: 'text' | 'separator';
  text: string;
  startPos: number;
  length: number;
}> {
  const segments = separateByRegExpWithIndices(
    text,
    pattern,
    includeSeparators
  );
  return segments.map(([i, segment]) => {
    if (hasAnyMatch(pattern, segment)) {
      return {
        kind: 'separator',
        text: segment,
        startPos: i,
        length: segment.length,
      };
    } else {
      return {
        kind: 'text',
        text: segment,
        startPos: i,
        length: segment.length,
      };
    }
  });
}

/**
 * Encapsulates some of the top-level functions in this module into one convenient class
 *
 */
export class BetterRegExp {
  sourceCode: string;
  flags: string;
  constructor(sourceCode: string, flags: string = '') {
    this.sourceCode = sourceCode;
    this.flags = flags;
  }
  static from(pattern: RegExp): BetterRegExp {
    return new BetterRegExp(pattern.source, pattern.flags);
  }
  toRegExp(): RegExp {
    return new RegExp(this.sourceCode, this.flags);
  }
  enforceGlobal(): BetterRegExp {
    if (!this.flags.includes('g')) {
      this.flags += 'g';
    }
    return this;
  }
  test(text: string): boolean {
    return this.toRegExp().test(text);
  }
  separateText(
    text: string,
    includeSeparators: boolean = false
  ): Array<string> {
    return separateByRegExp(text, this.toRegExp(), includeSeparators);
  }

  separateTextWithTyping(
    text: string,
    includeSeparators: boolean = false
  ): Array<{
    kind: 'text' | 'separator';
    text: string;
    startPos: number;
    length: number;
  }> {
    return separateByRegExpWithTyping(text, this.toRegExp(), includeSeparators);
  }
}
