import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode } from 'react';

import { Box, Text } from '@chakra-ui/react';

import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';
import { useCrumbs } from '@/hooks/useCrumbs';

export interface NavbarProps {}

const rightFacingSmallTriangle = '\u{25B8}';
const rightFacingArrow = '\u{2192}';
const doubleColon = '::';

export function CrumbSequence({
  sep = rightFacingSmallTriangle,
  path,
}: {
  sep?:
    | typeof rightFacingSmallTriangle
    | typeof rightFacingArrow
    | typeof doubleColon;
  path: string[];
}) {
  const items: ReactNode[] = [];
  const addItem = (item: ReactNode) => {
    const key = 'CrumSequence_' + items.length;
    items.push(<Box key={key}>{item}</Box>);
  };
  for (let i = 0; i < path.length - 1; i++) {
    addItem(<Text fontWeight="bold">{path[i]}</Text>);
    addItem(sep);
  }
  addItem(<Text fontWeight="bold">{path[path.length - 1]}</Text>);
  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap="0.25em">
      {items}
    </Box>
  );
}

export function Navbar({}: NavbarProps) {
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
