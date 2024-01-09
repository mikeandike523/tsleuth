import { ReactNode, useState } from 'react';
import { Box, Text, BoxProps } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';

import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { ASTIntermediate } from '@cli/lib/ast-traversal';
import { SerializableASTNode } from '@cli/lib/ast-traversal';
import { doubleColon, heavyPlusSign, heavyMinusSign } from './special-strings';
import { linkCss } from '@/css/link';
import { getSearchMatch } from '@common/search';

function FullyLoadedComponent({
  intermediate,
  sourceFilePath,
  symbolList,
  searchQuery,
}: {
  intermediate: ASTIntermediate;
  sourceFilePath: string[];
  symbolList: Set<string>;
  searchQuery: string;
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
    const searchName = node.name ?? '[[anonymous]]';

    let toAddItem = true;

    if (searchQuery !== '') {
      const match = getSearchMatch(searchQuery, searchName);
      if (match === null) {
        toAddItem = false;
      }
    }

    if (toAddItem) {
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
    }

    for (const child of node.children) {
      renderASTNode(
        child,
        level + 1,
        precedingPath.concat([node.id]),
        precedingNodePath.concat([node])
      );
    }
  };
  // Top level node is just a container, not a symbol, so jump to children of top level node
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
  symbolList,
  searchQuery,
  ...rest
}: {
  symbolList: Set<string>;
  nameComponent: ReactNode;
  startOpen?: boolean;
  sourceFilePath: string[];
  marginLeft?: BoxProps['marginLeft'];
  searchQuery: string;
} & BoxProps) {
  // @delete{
  startOpen = true;
  //}@delete

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
  console.log(symbolSearchNames);
  let shouldShow = true;
  if (searchQuery !== '') {
    if (symbolSearchNames.length > 0) {
      shouldShow = symbolSearchNames.some((name) => {
        const match = getSearchMatch(searchQuery, name);
        return match !== null;
      });
    } else {
      shouldShow = false;
    }
  }

  return (
    <Box
      display={shouldShow ? 'flex' : 'none'}
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
            symbolList={symbolList}
            searchQuery={searchQuery}
          />
        ) : (
          <>Loading...</>
        )}
      </Box>
    </Box>
  );
}
