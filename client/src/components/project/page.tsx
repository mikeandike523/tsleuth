import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode } from 'react';

import { Box } from '@chakra-ui/react';

import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { LoadingBarrierNoUnmount } from './simple-loading-barrier';
import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';

export interface PageProps {
  children?: ReactNode;
}

export function Page({ children }: PageProps) {
  const projectName = usePopulateProjectName();

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
        <Box height="100%" maxHeight="100%" overflow="auto">
          <Sidebar />
        </Box>
        <Box height="100%" maxHeight="100%" flex={1} overflow="auto">
          {children}
        </Box>
      </Box>
      <LoadingBarrierNoUnmount />
    </Box>
  );
}
