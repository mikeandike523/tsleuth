/**
 * Generalized types and utilities for JSON serialization/deserialization
 */

/**
 * Any serializable primitive
 */
export type SerializablePrimitive = string | number | boolean | null;

/**
 * Check if a value is a serializable primitive
 */
export function isSerializablePrimitive(
  value: unknown
): value is SerializablePrimitive {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  );
}

/**
 * Represents a serializable key in an object (symbols are not serializable)
 */
export type SerializableKey = string | number;

/**
 * Represents any serializable object that is not a class instance
 */
export type SerializableObject =
  | SerializablePrimitive
  | SerializableObject[]
  | {
      [key: SerializableKey]: SerializableObject;
    };

/**
 * Represents any value conforming to type `SerializableObject` that is an object at the top level
 */
export type SerializableRecord = {
  [key: SerializableKey]: SerializableObject;
};

/**
 * Represents any value conforming to type `SerializableObject` that is an array at the top level
 */
export type SerializableArray = SerializableObject[];
