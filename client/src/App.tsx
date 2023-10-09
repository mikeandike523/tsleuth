import React from 'react';
function doNothing(_: unknown) {}
doNothing(React);

import { MyTestComponent } from '@/components/my-test-component';

import { createRoot } from 'react-dom/client';

export default function App() {
  return (
    <div>
      Lorem ipsum dolor sit amet
      <br />
      <MyTestComponent />
    </div>
  );
}

const elem = document.getElementById('root');

if (elem) {
  createRoot(elem).render(<App />);
} else {
  console.log('Could not find element with id "root"');
}
