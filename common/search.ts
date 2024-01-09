/**
 * Contains all of the algorithms needed to effectively search through a list of symbols
 *
 * Used primarily to add searchbar to the left menu
 */

import { escapeRegExp, BetterRegExp, findAllMatches } from './rgx';
import { enumerate } from './arrays';

export const seperatorSpecialCharacters =
  '~!@#$%^&*()_+`[]{},.?;:\'"\\|/' as const;

export const seperatorSpecialCharactersRegex = new RegExp(
  escapeRegExp(seperatorSpecialCharacters),
  'g'
);

export type SeperatorSpecialCharacter =
  (typeof seperatorSpecialCharacters)[number];

export type SymbolNameSegment = {
  kind: 'text' | 'separator';
  text: string | SeperatorSpecialCharacter;
  startPos: number;
  length: number;
};

export type TextCase = 'UPPER' | 'LOWER' | 'MIXED' | 'NUMERIC';

export function getCase(character: string): TextCase | null {
  const capitals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  if (numbers.includes(character)) {
    return 'NUMERIC';
  }
  if (capitals.includes(character)) {
    return 'UPPER';
  }
  if (lowercase.includes(character)) {
    return 'LOWER';
  }
  return null;
}

/**
 *
 * Split a string into segments based upper/lower camel case conventions
 *
 * @param text - The text to analyze and splioot
 * @returns
 *
 * @attention - This function does not adhere to any particular standard, it is what I personalyl found reasonable
 *
 * @remarks
 * The rules are as follows:
 *
 * 0. Start the result as an array of one segment, the empty string (result=[''])
 * 1. A transition from either lowercase or number to Upper breaks into a new segment, unless it is the first character of the segment
 * Example: myCamelCase -> ['my', 'Camel', 'Case']
 * 2. A transition from uppercase back down to lowercase breaks into a new segment, placing the encounter uppercase in the new segment
 * Example: Suppose in a given project it is common to abbreviate "Wrapped Ref" to WR. Then for instance, myWRManager -> ['my', 'WR', 'Manager']
 */
export function splitByCamelCase(text: string): Array<string> {
  if (text.length < 2) {
    return [text];
  }
  const result = [''];
  let currentCase: TextCase | null = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const c = getCase(char);
    if (
      i !== 0 &&
      (currentCase === 'LOWER' || currentCase === 'NUMERIC') &&
      c === 'UPPER'
    ) {
      result.push('');
    } else {
      const nextCase = i + 1 <= text.length - 1 ? getCase(text[i + 1]) : null;
      if (i !== 0 && c === 'UPPER' && nextCase === 'LOWER') {
        result.push('');
      }
    }
    result[result.length - 1] += char;
    currentCase = c;
  }
  return result;
}

/**
 *
 * @param symbolName - A string to analyze, typically the name of a symbol in some codebase
 * @param splitByEnglishWords - Whether to perform an additional pass to split text by English words
 *
 * @remarks
 * Multi-pass approach
 *
 * 1. Split by special characters
 * 2. Split by camelCase and pascalCase conventions
 * 3. Optionally, split by words in the english dictionary
 *
 */
export function analyzeSymbolName(
  symbolName: string,
  splitByEnglishWords: boolean = false
): Array<SymbolNameSegment> {
  // Pass 1
  const parts = BetterRegExp.from(
    seperatorSpecialCharactersRegex
  ).separateTextWithTyping(symbolName, true);
  let result: Array<SymbolNameSegment> = parts.map((component) => {
    if (component.kind === 'text') {
      return {
        kind: 'text',
        text: component.text,
        startPos: component.startPos,
        length: component.length,
      };
    } else {
      return {
        kind: 'separator',
        text: component.text,
        startPos: component.startPos,
        length: component.length,
      };
    }
  });
  let unflattenedResult: Array<SymbolNameSegment | Array<SymbolNameSegment>> =
    [];
  const pass2Procedure = (segment: SymbolNameSegment): SymbolNameSegment[] => {
    const split = splitByCamelCase(segment.text);
    return split.map((s) => {
      return {
        kind: 'text',
        text: s,
        startPos: segment.startPos,
        length: s.length,
      };
    });
  };
  const pass3Procedure = (segment: SymbolNameSegment): SymbolNameSegment[] => {
    if (!splitByEnglishWords) {
      return [segment];
    }
    // @todo
    // This might be quite challenging and require and external library
    // Don't feel like doing it now
    // So for now, just "return [segment]" which serves as a passthrough

    const todoPasstrhough = [segment];
    return todoPasstrhough;
  };
  for (const segment of result) {
    if (segment.kind === 'text') {
      unflattenedResult.push(pass2Procedure(segment));
    } else {
      unflattenedResult.push(segment);
    }
  }
  result = unflattenedResult.flat();
  unflattenedResult = [];
  for (const segment of result) {
    if (segment.kind === 'text') {
      unflattenedResult.push(pass3Procedure(segment));
    } else {
      unflattenedResult.push(segment);
    }
  }
  result = unflattenedResult.flat();
  return result;
}

export function getSearchMatches(
  searchQuery: string,
  symbolName: string,
  considerCase: boolean = false,
  considerSeparators: boolean = false
): RegExpExecArray[] {
  const searchQuerySegments = analyzeSymbolName(searchQuery).filter(
    (segment) => {
      if (!considerSeparators && segment.kind === 'separator') {
        return false;
      }
      return true;
    }
  );
  const regExpSourceCode = searchQuerySegments
    .map((segment) => {
      return `(${escapeRegExp(segment.text)})`;
    })
    .join('(.*?)');
  const regExp = new RegExp(regExpSourceCode, 'g' + (considerCase ? '' : 'i'));
  return findAllMatches(regExp, symbolName);
}
