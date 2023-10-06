export function normalizeLineEndings(
  content: string,
  eol: '\r\n' | '\n',
): string {
  return content.replace(/\r?\n/g, eol);
}
