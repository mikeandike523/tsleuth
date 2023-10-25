import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box } from '@chakra-ui/react';

import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';

export interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const projectName = usePopulateProjectName();
  return (
    <Box width="100%" flex={0} borderBottom="2px solid black">
      {projectName ? <></> : 'Loading...'}
    </Box>
  );
}
