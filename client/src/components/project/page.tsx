import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode, useState, useEffect, forwardRef, RefObject } from 'react';

import { Box, BoxProps } from '@chakra-ui/react';
import { throttle } from 'lodash';

import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { LoadingBarrierNoUnmount } from './simple-loading-barrier';
import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';

export interface PageProps extends BoxProps {
  children?: ReactNode;
  ref: RefObject<HTMLDivElement | null>;
}

export const Page = forwardRef(function Page({
  children,
  ref,
  ...rest
}: PageProps) {
  const [windowHeight, setWindowHeight] = useState<number | null>(null);

  const handleResize = throttle(() => {
    setWindowHeight(window.innerHeight);
  }, 250);

  const handleSetInitialSize = () => {
    setWindowHeight(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  useEffect(() => {
    handleSetInitialSize();
  }, [windowHeight === null]);

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
          ref={ref}
          {...rest}
        >
          {children}
        </Box>
      </Box>
      <LoadingBarrierNoUnmount />
    </Box>
  );
});
