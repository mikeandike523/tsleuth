import EnsureReactInScope from './EnsureReactInScope';

import { createRoot } from 'react-dom/client';

import { HashRouter, Routes, Route } from 'react-router-dom';

import { ChakraProvider } from '@chakra-ui/react';

import Home from '@/pages/index';

EnsureReactInScope();

export default function App() {
  return (
    <ChakraProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* More routes tbd */}
        </Routes>
      </HashRouter>
    </ChakraProvider>
  );
}

const elem = document.getElementById('root');

if (elem) {
  createRoot(elem).render(<App />);
} else {
  console.log('Could not find element with id "root"');
}
