import EnsureReactInScope from './EnsureReactInScope';

import { createRoot } from 'react-dom/client';

import { HashRouter, Route, Routes } from 'react-router-dom';

import { ChakraProvider } from '@chakra-ui/react';
import { RecoilRoot } from 'recoil';

import SubpageRouter from './pages/subpage-router';

EnsureReactInScope();

import '@/highlightjs-themes/monokai.css';

export default function App() {
  return (
    <RecoilRoot>
      <ChakraProvider>
        <HashRouter>
          <Routes>
            <Route path="*" element={<SubpageRouter />} />
          </Routes>
        </HashRouter>
      </ChakraProvider>
    </RecoilRoot>
  );
}

const elem = document.getElementById('root');

if (elem) {
  createRoot(elem).render(<App />);
} else {
  console.log('Could not find element with id "root"');
}
