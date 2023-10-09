import React from 'react';
function doNothing(_: unknown) {}
doNothing(React);

export function MyTestComponent({}: {}) {
  return <>I am a test component</>;
}
