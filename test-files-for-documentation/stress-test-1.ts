/**
 *  A stress-test file for the documentation generator.
 *
 *  Note: this comment should NOT show up in the generated documentation.
 */

/**
 * an item that should register "const" and "export" modifiers
 */
export const a = 'b';

/**
 * an item that should register "let" and "export" modifiers
 */
// eslint-disable-next-line prefer-const
export let c = 'd';

/**
 * an item that should register "var" and "export" modifiers
 */
// eslint-disable-next-line no-var
export var e = 'f';

/**
 * an item that is a variable statement that contains an arrow function
 */
export const g = () => 'h';
