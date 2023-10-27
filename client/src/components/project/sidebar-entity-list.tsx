import { ReactNode } from 'react';

import { Box, Text, BoxProps } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { ASTIntermediate } from '@cli/lib/ast-traversal';
import { SerializableASTNode } from '@cli/lib/ast-traversal';
import { doubleColon } from './special-strings';
import { linkCss } from '@/css/link';

function FullyLoadedComponent({
  intermediate,
  sourceFilePath,
}: {
  intermediate: ASTIntermediate;
  sourceFilePath: string[];
}) {
  const navigate = useNavigate();
  const items: ReactNode[] = [];
  const addItem = (item: ReactNode) => {
    const key = 'FullyLoadedComponent_' + items.length;
    items.push(<Box key={key}>{item}</Box>);
  };
  const renderASTNode = (
    node: SerializableASTNode,
    level: number = 0,
    precedingPath: string[]
  ) => {
    const indent = 2 * level + 'em';
    addItem(
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
      >
        <Text
          css={linkCss}
          marginLeft={indent}
          onClick={() => {
            const url = sourceFilePath
              .concat([':', ...[...precedingPath, node.id]])
              .join('/');
            navigate(url);
          }}
        >
          {doubleColon}
          {node.name ?? '[[anonymous]]'}
        </Text>
        &nbsp;
        <Text fontStyle="italic" color="green">
          ({node.kindName})
          {node.narrowKindName ? ` (${node.narrowKindName})` : ''}
        </Text>
      </Box>
    );

    for (const child of node.children) {
      renderASTNode(child, level + 1, precedingPath.concat([node.id]));
    }
  };
  // Top level node is just a container, not a symbol, so jump to children of top level node
  for (const childNode of (intermediate.root as SerializableASTNode).children) {
    renderASTNode(childNode, 0, []);
  }
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      {items}
    </Box>
  );
}

export function SidebarEntityList({
  sourceFilePath,
  ...rest
}: {
  sourceFilePath: string[];
} & BoxProps) {
  const astIntermediate = useASTIntermediate(sourceFilePath);

  return (
    <Box {...rest}>
      {astIntermediate ? (
        <FullyLoadedComponent
          sourceFilePath={sourceFilePath}
          intermediate={astIntermediate}
        />
      ) : (
        <>Loading...</>
      )}
    </Box>
  );
}
