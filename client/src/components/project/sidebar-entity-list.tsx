import { ReactNode, useState } from 'react';

import { Box, Text, BoxProps } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { ASTIntermediate } from '@cli/lib/ast-traversal';
import { SerializableASTNode } from '@cli/lib/ast-traversal';
import { doubleColon, heavyPlusSign, heavyMinusSign } from './special-strings';
import { linkCss } from '@/css/link';
import { useCrumbs } from '@/hooks/useCrumbs';

function FullyLoadedComponent({
  intermediate,
  sourceFilePath,
}: {
  intermediate: ASTIntermediate;
  sourceFilePath: string[];
}) {
  const navigate = useNavigate();
  const crumbs = useCrumbs();
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
  startOpen = false,
  ...rest
}: {
  startOpen?: boolean;
  sourceFilePath: string[];
} & BoxProps) {
  const astIntermediate = useASTIntermediate(sourceFilePath);
  const [isOpen, setIsOpen] = useState(startOpen);
  return (
    <Box
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      {...rest}
    >
      <Box
        background="lightgreen"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
      >
        <Text
          color="black"
          css={linkCss}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? heavyMinusSign : heavyPlusSign}
        </Text>
        <Text>&nbsp;</Text>
        <Text>Symbols</Text>
      </Box>
      <Box display={isOpen ? 'flex' : 'none'}>
        {astIntermediate ? (
          <FullyLoadedComponent
            sourceFilePath={sourceFilePath}
            intermediate={astIntermediate}
          />
        ) : (
          <>Loading...</>
        )}
      </Box>
    </Box>
  );
}
