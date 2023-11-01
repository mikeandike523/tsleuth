export function gcf(a: number, b: number): number {
  if (b === 0) {
    return a;
  }
  return gcf(b, a % b);
}

export function arrayGcf(arr: number[]): number {
  return arr.reduce(gcf);
}
