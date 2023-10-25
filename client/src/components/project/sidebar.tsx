import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box } from '@chakra-ui/react';

export interface SidebarProps {}
export function Sidebar({}: SidebarProps) {
  return (
    <Box height="100%" borderRight="2px solid black">
      Sidebar
    </Box>
  );
}
