import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box } from '@chakra-ui/react';

export interface SidebarProps {}
export function Sidebar({}: SidebarProps) {
  return <Box height="100%">Sidebar</Box>;
}
