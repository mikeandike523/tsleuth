import React from 'react';

import { ReactNode } from 'react';

/**
 * used to ensure that the page fills the entire viewport
 *
 * @remarks - param "props" is an arbitrary name and is not found in the signature, as it is a binding for an object destructuring statement
 *
 * @param props - The destructured properties of the component
 */
export function Container({
  children,
}: {
  children?: ReactNode | ReactNode[];
}) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </div>
  );
}
