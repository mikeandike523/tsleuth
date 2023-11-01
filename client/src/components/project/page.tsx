import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode, useState, useEffect } from 'react';

import { Box } from '@chakra-ui/react';
import { throttle } from 'lodash';

import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { LoadingBarrierNoUnmount } from './simple-loading-barrier';
import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';

export interface PageProps {
  children?: ReactNode;
}

export function Page({ children }: PageProps) {
  const projectName = usePopulateProjectName();

  const [windowHeight, setWindowHeight] = useState<number | null>(null);

  const handleResize = throttle(() => {
    setWindowHeight(window.innerHeight / window.devicePixelRatio);
  }, 250);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  useEffect(() => {
    handleResize();
  }, []);

  return (
    <Box
      position="fixed"
      width="100vw"
      height="100vh"
      margin={0}
      padding={0}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
    >
      <Navbar />
      <Box
        width="100%"
        flex={1}
        display="flex"
        flexDirection="row"
        alignItems="flex-start"
        justifyContent="flex-start"
      >
        <Box
          height={windowHeight === null ? 0 : windowHeight - 64 + 'px'}
          maxHeight="100%"
          overflowY="auto"
        >
          <Sidebar />
        </Box>
        <Box
          height={windowHeight === null ? 0 : windowHeight - 64 + 'px'}
          maxHeight="100%"
          flex={1}
          overflowY="auto"
        >
          {children}
        </Box>
      </Box>
      <LoadingBarrierNoUnmount />
    </Box>
  );
}
