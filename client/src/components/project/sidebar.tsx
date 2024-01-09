import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Input } from '@chakra-ui/react';

import { linkCss } from '@/css/link';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { ContentIndex } from '@/lib/content-index';
import { basenameIsSourceFile } from '@/lib/source-files';
import { PathHierarchyNode } from '@common/filesystem';
import { SidebarEntityList } from './sidebar-entity-list';
import { fileFolder, pageFacingUp } from './special-strings';

export interface SidebarProps {}

export function SidebarList({
  contentIndex,
  symbolList,
  searchQuery,
}: {
  contentIndex: ContentIndex;
  symbolList: Set<string>;
  searchQuery: string;
}) {
  const navigate = useNavigate();
  const items: ReactNode[] = [];
  const addItem = (item: ReactNode) => {
    const key = 'SidebarList_' + items.length;
    items.push(<Box key={key}>{item}</Box>);
  };
  const hierarchy = contentIndex.hierarchy;
  const renderHierarchyItem = (
    node: PathHierarchyNode<string>,
    level: number = 0,
    nodePath: string[] = []
  ) => {
    const margin = 2 * (level - 1) + 'em';
    const extraMargin = 2 * level + 'em';
    const url = `${nodePath.join('/')}`;
    if (level > 0) {
      const isFile = basenameIsSourceFile(nodePath[nodePath.length - 1]);
      const nameComponent = (
        <>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="flex-start"
          >
            {!isFile && <Box height="1.5em" width={margin}></Box>}
            <Box
              onClick={() => {
                navigate(url + (isFile ? '/:/full_source_code' : ''));
              }}
              css={linkCss}
              height="1.5em"
              lineHeight="1.5em"
              fontWeight={isFile ? 'bold' : 'regular'}
            >
              {isFile ? pageFacingUp : fileFolder}
              {node.segment}
              {!isFile && '/'}
            </Box>
          </Box>
        </>
      );

      if (nodePath.length > 0) {
        const baseName = nodePath[nodePath.length - 1];
        if (basenameIsSourceFile(baseName)) {
          addItem(
            <SidebarEntityList
              nameComponent={nameComponent}
              marginLeft={extraMargin}
              sourceFilePath={nodePath}
              symbolList={symbolList}
              searchQuery={searchQuery}
            />
          );
        } else {
          addItem(nameComponent);
        }
      }
    }

    const childKeys = Object.keys(node.children);
    for (const childKey of childKeys) {
      renderHierarchyItem(
        node.children[
          childKey as keyof typeof node.children
        ] as PathHierarchyNode<string>,
        level + 1,
        [...nodePath, childKey]
      );
    }
  };
  renderHierarchyItem(hierarchy, 0, []);
  return <>{items}</>;
}

export function Sidebar({}: SidebarProps) {
  const contentIndex = usePopulateContentIndex();
  const symbolList = new Set<string>();
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      <Box width="100%">
        <Input
          type="text"
          width="100%"
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />
      </Box>
      <Box flex={1}>
        {contentIndex ? (
          <SidebarList
            searchQuery={searchQuery}
            contentIndex={contentIndex}
            symbolList={symbolList}
          />
        ) : (
          <>Loading...</>
        )}
      </Box>
    </Box>
  );
}
