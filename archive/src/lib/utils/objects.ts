export function deepCopyWithoutUndefined<T extends object | null = object>(
  obj: T
): T {
  if (obj === null) {
    return null as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      deepCopyWithoutUndefined(item as unknown as T)
    ) as unknown as T;
  }

  const result: Record<string, unknown> = {};

  Object.keys(obj).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];

    if (value !== undefined) {
      result[key] = deepCopyWithoutUndefined(value as unknown as T);
    }
  });

  return result as T;
}
