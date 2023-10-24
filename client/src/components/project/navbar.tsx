import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box } from '@chakra-ui/react';

export interface NavbarProps {
  projectName?: string;
}

export function Navbar({}: NavbarProps) {
  return <Box width="100%" flex={0}></Box>;
}
