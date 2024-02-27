/**
 * Returns a rotating sequence of slightly differently shaped and filled UTF8 bullet point characters
 */
export class UTF8BulletSequence {
  static bullets: string[] = [
    '\u2022', // • Filled round bullet
    '\u25E6', // ◦ Hollow round bullet
    '\u2023', // ‣ Triangular bullet
    '\u25C6', // ◆ Filled diamond bullet
    '\u25C7', // ◇ Hollow diamond bullet
    '\u25A0', // ■ Filled square bullet
    '\u25A1', // □ Hollow square bullet
    '\u2043', // ⁃ Hyphen bullet
  ];
  static level(level: number) {
    const mod = level % UTF8BulletSequence.bullets.length;
    return UTF8BulletSequence.bullets[mod];
  }
}
