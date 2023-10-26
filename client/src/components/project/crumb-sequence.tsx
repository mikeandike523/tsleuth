import { ReactNode } from 'react';

import { Box, Text } from '@chakra-ui/react';

import {
  rightFacingSmallTriangle,
  rightFacingArrow,
  doubleColon,
} from './special-strings';
import { linkCss } from '@/css/link';

export function CrumbSequence({
  sep = rightFacingSmallTriangle,
  path,
  onNavigate = () => {},
}: {
  sep?:
    | typeof rightFacingSmallTriangle
    | typeof rightFacingArrow
    | typeof doubleColon;
  path: string[];
  onNavigate?: (path: string[]) => void;
}) {
  const items: ReactNode[] = [];
  const addItem = (item: ReactNode) => {
    const key = 'CrumSequence_' + items.length;
    items.push(<Box key={key}>{item}</Box>);
  };
  for (let i = 0; i < path.length - 1; i++) {
    addItem(
      <Text
        css={linkCss}
        fontWeight="bold"
        onClick={() => {
          onNavigate(path.slice(0, i + 1));
        }}
      >
        {path[i]}
      </Text>
    );
    addItem(sep);
  }
  addItem(
    <Text
      css={linkCss}
      fontWeight="bold"
      onClick={() => {
        onNavigate(path.slice(0, path.length - 1));
      }}
    >
      {path[path.length - 1]}
    </Text>
  );
  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap="0.25em">
      {items}
    </Box>
  );
}
