/**
 * Any primitive value that can be represented directly in JSON
 * `undefined` cannot be represented losslessly in JSON and therefore is not serializable
 */
export type SerializablePrimitive = string | number | boolean | null;

/**
 * Checks if a value is a serializable primitive
 */
export function isSerializablePrimitive(
  value: any,
): value is SerializablePrimitive {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  );
}

/**
 * A serializable key for an object. Can be string or number. `Symbol` type is not serializable
 */
export type SerializableKey = string | number;

/**
 * Any serializable object
 */
export type SerializableObject =
  | SerializablePrimitive
  | SerializableObject[]
  | {
      [key: SerializableKey]: SerializableObject;
    };

/**
 * A serializable object that is an array at the top level
 */
export type SerializableArray = SerializableObject[];

/**
 * A serializable object that is an object at the top level
 */
export type SerializableRecord = {
  [key: SerializableKey]: SerializableObject;
};
