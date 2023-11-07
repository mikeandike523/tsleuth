import { arrayGcf } from './math';

export function normalizeLineEndings(
  content: string,
  eol: '\r\n' | '\n'
): string {
  return content.replace(/\r?\n/g, eol);
}

/**
 * Thrown when trying to dedent inconsitently indented text
 */
export class IndentationInconsistentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndentationInconsistentError';
  }
}

/**
 * Going to implement our own dedent even though there are probably libraries out there
 */
export function dedent(indentedText: string): string {
  // Step 0, normalize to \n
  indentedText = normalizeLineEndings(indentedText, '\n');
  // Step 1, remove leading and trailing newlines, but not other whitespace
  indentedText = indentedText.replace(/^\n+/g, '').replace(/\n+$/g, '');
  // Step 2, if there is only one line, then the behaviour should be to strip leading whitespace and return
  if (!indentedText.includes('\n')) {
    return indentedText.replace(/^\s+/g, '');
  }
  // Step 3, find the common indentation between the lines
  const lines = indentedText.split('\n');
  const leadingWhitespaces: string[] = [];
  for (const line of lines) {
    // Use regex to extract leading whitespace
    const match = line.match(/^(\s+)/);
    if (match) {
      leadingWhitespaces.push(match[1]);
    }
  }
  // Step 4, handle the easiest case of indent incosistency
  let hasAtLeastOneTab = false;
  for (const leadingWhitespace of leadingWhitespaces) {
    if (leadingWhitespace.includes('\t')) {
      hasAtLeastOneTab = true;
      break;
    }
  }
  if (hasAtLeastOneTab) {
    for (const leadingWhitespace of leadingWhitespaces) {
      // Use regex to test if the leading whitespace contains any character but tab
      const match = leadingWhitespace.match(/[^\t]/g);
      if (match) {
        throw new IndentationInconsistentError(
          `Inconsistent indentation detected: at least one line has a tab, but at least one line uses a non-tab character`
        );
      }
    }
  }
  // The converse handles the other easy case of indent incosistency
  let hasAtLeastOneSpace = false;
  for (const leadingWhitespace of leadingWhitespaces) {
    if (leadingWhitespace.includes(' ')) {
      hasAtLeastOneSpace = true;
      break;
    }
  }
  if (hasAtLeastOneSpace) {
    for (const leadingWhitespace of leadingWhitespaces) {
      // Use regex to test if the leading whitespace contains any character but space
      const match = leadingWhitespace.match(/[^ ]/g);
      if (match) {
        throw new IndentationInconsistentError(
          `Inconsistent indentation detected: at least one line has a space, but at least one line uses a non-space character`
        );
      }
    }
  }

  // The hard case is detecting if number of spaces per indent is not consistent
  // I guess criteria is if the gcf of the number of leading spaaces in each line is 1, but there is no line that has exactly 1 leading space, then it is incosistent
  // Note: This means that we consider index=1 space to be valid, and I don't know if that is really relevant

  // Note: We always consider a single tab to be a single indent, we don't calculate gcf for the tab case

  // Since we already checked tab space consistency, its easy to derive the indentation type from the data

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
 * @param docCommentText
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
          console.log('hasMatched', match);
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
  const trueDocCommentPattern = /(^|\n)\s*?\/\*\*.*?\*\/\s*?(\n|$)/gs; // Once again, not advanced enough to detect conforming to "leading *" doc comment standards

  return normalizedCommentText.match(trueDocCommentPattern) || [];
}
