import EnsureReactInScope from './EnsureReactInScope';

import { createRoot } from 'react-dom/client';

import { HashRouter, Routes, Route } from 'react-router-dom';

import { ChakraProvider } from '@chakra-ui/react';
import { RecoilRoot } from 'recoil';

import Home from '@/pages/index';
import SubpageRouter from './pages/subpage-router';

EnsureReactInScope();

export default function App() {
  return (
    <RecoilRoot>
      <ChakraProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="" element={<Home />} />
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
