import { arrayGcf } from './math';

export function normalizeLineEndings(
  content: string,
  eol: '\r\n' | '\n'
): string {
  return content.replace(/\r?\n/g, eol);
}

/**
 * Thrown when trying to dedent inconsistently indented text
 */
export class IndentationInconsistentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndentationInconsistentError';
  }
}

export function dedent(indentedText: string): string {
  indentedText = normalizeLineEndings(indentedText, '\n');
  indentedText = indentedText.replace(/^\n+/g, '').replace(/\n+$/g, '');
  if (!indentedText.includes('\n')) {
    return indentedText.replace(/^\s+/g, '');
  }
  const lines = indentedText.split('\n');
  const leadingWhitespaces: string[] = [];
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      leadingWhitespaces.push(match[1]);
    }
  }
  let hasAtLeastOneTab = false;
  for (const leadingWhitespace of leadingWhitespaces) {
    if (leadingWhitespace.includes('\t')) {
      hasAtLeastOneTab = true;
      break;
    }
  }
  if (hasAtLeastOneTab) {
    for (const leadingWhitespace of leadingWhitespaces) {
      const match = leadingWhitespace.match(/[^\t]/g);
      if (match) {
        throw new IndentationInconsistentError(
          `Inconsistent indentation detected: at least one line has a tab, but at least one line uses a non-tab character`
        );
      }
    }
  }
  let hasAtLeastOneSpace = false;
  for (const leadingWhitespace of leadingWhitespaces) {
    if (leadingWhitespace.includes(' ')) {
      hasAtLeastOneSpace = true;
      break;
    }
  }
  if (hasAtLeastOneSpace) {
    for (const leadingWhitespace of leadingWhitespaces) {
      const match = leadingWhitespace.match(/[^ ]/g);
      if (match) {
        throw new IndentationInconsistentError(
          `Inconsistent indentation detected: at least one line has a space, but at least one line uses a non-space character`
        );
      }
    }
  }

  let indentationType: 'tab' | 'space' | 'no-indent' = 'no-indent';
  for (const leadingWhitespace of leadingWhitespaces) {
    if (leadingWhitespace.includes('\t')) {
      indentationType = 'tab';
      break;
    }
    if (leadingWhitespace.includes(' ')) {
      indentationType = 'space';
      break;
    }
  }
  if (indentationType === 'space') {
    const spaceCounts = leadingWhitespaces.map((item) => item.length);
    const gcf = arrayGcf(spaceCounts);
    if (gcf === 1) {
      if (!spaceCounts.includes(1)) {
        throw new IndentationInconsistentError(
          `Inconsistent indentation detected: There is at least one indent whose space count does not match the others`
        );
      }
    }
  }
  if (indentationType === 'tab') {
    const tabCounts = leadingWhitespaces.map((item) => item.length);
    const minCount = Math.min(...tabCounts);
    const adjustedTabCounts = tabCounts.map((count) => count - minCount);
    return lines
      .map((line, i) => {
        const stripped = line.replace(/^(\s+)/, '');
        return '\t'.repeat(adjustedTabCounts[i]) + stripped;
      })
      .join('\n');
  } else if (indentationType === 'space') {
    const spaceCounts = leadingWhitespaces.map((item) => item.length);
    const gcf = arrayGcf(spaceCounts);
    const indentString = ' '.repeat(gcf);
    const indentCounts = leadingWhitespaces.map((item) => item.length / gcf);
    const minIndentCount = Math.min(...indentCounts);
    const adjustedIndentCounts = indentCounts.map(
      (count) => count - minIndentCount
    );
    return lines
      .map((line, i) => {
        const stripped = line.replace(/^(\s+)/, '');
        return indentString.repeat(adjustedIndentCounts[i]) + stripped;
      })
      .join('\n');
  }
  return lines.map((line) => line.replace(/^(\s+)/, '')).join('\n');
}

export class InvalidDocCommentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDocCommentError';
  }
}

/**
 *
 * Strips doc comment syntax and neatly arranges in a paragraph
 *
 * @param docCommentText -
 * @returns
 */
export function docCommentToParagraph(docCommentText: string): string {
  const normalized = normalizeLineEndings(docCommentText, '\n');
  if (!normalized.includes('\n')) {
    const extractor = /^\s*\/\*\*(.*?)\*\/\s*$/g;
    const match = normalized.match(extractor);
    if (!match) {
      throw new InvalidDocCommentError(
        `Invalid single line doc comment syntax: ${docCommentText}`
      );
    }
    return match[1];
  }
  const startPattern = /^.*?\/\*\*.*?$/;
  const plainStartPattern = /^.*?\/\*\*\s*$/;
  const endPattern = /^\s*\*\/\s*$/;
  const plainEndPattern = /^\s*\*\/\s*/;
  const blankCommentLinePattern = /^\s*\*$/;

  const extractorPatterns = [
    /^\s*\/\*\*(\s+.*?)\s*$/,
    /^\s*\*(\s+.*?)\s*$/,
    /^\s*(.*?)\*\/\s*$/,
  ];

  const lines = normalized.split('\n');
  const extractedLines: string[] = [];
  for (const line of lines) {
    const matchesStartPattern = line.match(startPattern);
    const matchesPlainStartPattern = line.match(plainStartPattern);
    if (matchesStartPattern && !matchesPlainStartPattern) {
      console.warn(
        'It is not recommended to put text on the first line of a multiline doc comment',
        normalized
      );
    }
    const matchesEndPattern = line.match(endPattern);
    const matchesPlainEndPattern = line.match(plainEndPattern);
    if (matchesEndPattern && !matchesPlainEndPattern) {
      console.warn(
        'It is not recommended to put text on the last line of a multiline doc comment',
        normalized
      );
    }

    let hasMatched = false;
    if (blankCommentLinePattern.test(line)) {
      hasMatched = true;
    } else {
      for (const extractorPattern of extractorPatterns) {
        const match = line.match(extractorPattern);
        if (match) {
          extractedLines.push(match[1]);
          hasMatched = true;
          break;
        }
      }
    }

    if (!hasMatched) {
      if (
        startPattern.test(line) ||
        plainStartPattern.test(line) ||
        endPattern.test(line) ||
        plainEndPattern.test(line) ||
        blankCommentLinePattern.test(line)
      ) {
        continue;
      } else {
        if (!/^\s*\*.*?\s*$/.test(line)) {
          throw new InvalidDocCommentError(
            `A doc comment line that is neither a start nor end must begin have the leading "*" (regex /^\\s*?\\*.*?$/): ${line}`
          );
        } else {
          throw new InvalidDocCommentError(
            `Invalid doc comment line syntax: ${line}`
          );
        }
      }
    }
  }

  return dedent(extractedLines.join('\n'));
}

/**
 * Extracts all (potential) true-doc-comments from a string
 *
 * Use case: Typescript `getLeadingCommentRanges` may capture more than one doc comment (for instance, maybe there is a comment at the top of the module), and it also may capture blocks of text whose lines start with "//"
 *
 *
 * This algorithm is not advanced enough to detect if the doc comment conforms to the standard where each line needs a leading *. It just looks for the start and end patten
 *
 * Note, the text eol is normalized to LF not CRLF
 * Tbh, why would anyone really use CRLF when they have the choice?
 *
 * @param commentText - The text to extract doc comments from
 */
export function getDocComments(commentText: string): string[] {
  const normalizedCommentText = normalizeLineEndings(commentText, '\n');
  const trueDocCommentPattern = /(^|\n)\s*?\/\*\*.*?\*\/\s*?(\n|$)/gs;
  return normalizedCommentText.match(trueDocCommentPattern) || [];
}
