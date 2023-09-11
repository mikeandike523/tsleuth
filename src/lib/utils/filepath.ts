export function stripExt(filename: string): string {
  if (!filename.includes('.')) return filename;
  return filename.substring(0, filename.lastIndexOf('.'));
}
