import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode } from 'react';

import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';
import { useCrumbs } from '@/hooks/useCrumbs';
import { CrumbSequence } from './crumb-sequence';
import {
  rightFacingSmallTriangle,
  rightFacingArrow,
  doubleColon,
} from './special-strings';

export interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const navigate = useNavigate();
  const projectName = usePopulateProjectName();
  const crumbs = useCrumbs();
  const items: ReactNode[] = [];
  const addItem = (item: ReactNode) => {
    const key = 'navbar_item_' + items.length;
    items.push(<Box key={key}>{item}</Box>);
  };
  addItem(
    <Text as="h1" fontSize="2xl">
      {projectName ?? 'Loading...'}
    </Text>
  );
  if (crumbs.routeType !== 'index') {
    addItem(
      <Text as="h1" fontSize="2xl">
        {rightFacingSmallTriangle}
      </Text>
    );
    addItem(
      <CrumbSequence
        onNavigate={(path: string[]) => {
          navigate(path.join('/'));
        }}
        sep={rightFacingArrow}
        path={crumbs.containingDirectory.concat([crumbs.basename])}
      />
    );
    if (crumbs.entityPath && crumbs.entityPath.length > 0) {
      addItem(
        <Text as="div" fontSize="xl">
          {rightFacingArrow}
        </Text>
      );
      addItem(<CrumbSequence sep={doubleColon} path={crumbs.entityPath} />);
    }
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="row"
      alignItems="center"
      background="skyblue"
      padding="0.5em"
      gap="0.5em"
      borderBottom="2px solid black"
    >
      {items}
    </Box>
  );
}
