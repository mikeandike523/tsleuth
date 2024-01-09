export function processIndexAndFlatten<T>(
  array: Array<T>,
  index: number,
  callback: (item: T) => Array<T>
): Array<T> {
  const subArray = callback(array[index]);
  return [
    ...array.slice(0, index), // items prior to the index
    ...subArray, // processed sub-array
    ...array.slice(index + 1), // items following the index
  ];
}

export function enumerate<T>(items: Array<T>): Array<[number, T]> {
  return items.map((item, index) => [index, item]);
}
