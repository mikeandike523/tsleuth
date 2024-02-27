import { Box, BoxProps, Text } from '@chakra-ui/react';
import { css } from '@emotion/react';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { linkCss } from '@/css/link';
import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { ASTIntermediate, SerializableASTNode } from '@cli/lib/ast-traversal';
import { doubleColon, heavyMinusSign, heavyPlusSign } from './special-strings';

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
    precedingPath: string[],
    precedingNodePath: SerializableASTNode[] = []
  ) => {
    const hasDocumentation =
      node.documentation !== null && node.documentation.trim() !== '';
    const indent = 2 * level + 'em';

    addItem(
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
      >
        <Text
          marginLeft={indent}
          onClick={() => {
            const url = sourceFilePath
              .concat([':', ...[...precedingPath, node.id]])
              .join('/');
            navigate(url);
          }}
          color={hasDocumentation ? 'magenta' : 'blue'}
          as="span"
          css={css`
            cursor: pointer;
            text-decoration: none;
            &:hover {
              text-decoration: underline;
            }
          `}
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
      renderASTNode(
        child,
        level + 1,
        precedingPath.concat([node.id]),
        precedingNodePath.concat([node])
      );
    }
  };
  for (const childNode of (intermediate.root as SerializableASTNode).children) {
    renderASTNode(childNode, 0, [], []);
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
  nameComponent,
  sourceFilePath,
  startOpen = false,
  marginLeft,
  ...rest
}: {
  nameComponent: ReactNode;
  startOpen?: boolean;
  sourceFilePath: string[];
  marginLeft?: BoxProps['marginLeft'];
} & BoxProps) {
  const astIntermediate = useASTIntermediate(sourceFilePath);
  const [isOpen, setIsOpen] = useState(startOpen);

  const symbolSearchNames: string[] = [];

  const visit = (node: SerializableASTNode, ignoreName = false) => {
    if (!ignoreName) {
      symbolSearchNames.push(node.name ?? '[[anonymous]]');
    }
    for (const child of node.children) {
      visit(child, false);
    }
  };
  if (astIntermediate?.root) {
    visit(astIntermediate?.root, true);
  }
  return (
    <Box
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      marginLeft={marginLeft}
      {...rest}
    >
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
      >
        {nameComponent}
        <Text>&nbsp;</Text>
        <Text
          color="black"
          css={linkCss}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? heavyMinusSign : heavyPlusSign}
        </Text>
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
