import React from 'react';
export default function EnsureReactInScope() {
  const augmentedGlobalThis = globalThis as {
    React: typeof React;
  };
  augmentedGlobalThis.React = React;
}
