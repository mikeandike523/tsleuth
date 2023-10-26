export function basenameIsSourceFile(basename: string | undefined) {
  if (typeof basename === 'undefined') {
    return false;
  }
  basename = basename.toLowerCase();
  const ext = basename.includes('.') ? basename.split('.').pop() ?? '' : '';
  if (
    [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'jsonc',
      'css',
      'scss',
      'xml',
      'txt',
      'md',
    ].includes(ext)
  ) {
    return true;
  }
  return false;
}
