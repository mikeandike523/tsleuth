import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box } from '@chakra-ui/react';
import { ReactNode, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';

import { linkCss } from '@/css/link';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { ContentIndex } from '@/lib/content-index';
import { basenameIsSourceFile } from '@/lib/source-files';
import { PathHierarchyNode } from '@common/filesystem';
import { SidebarEntityList } from './sidebar-entity-list';
import { fileFolder, pageFacingUp } from './special-strings';

export interface SidebarProps {}

export function SidebarList({ contentIndex }: { contentIndex: ContentIndex }) {
  const hierarchy = contentIndex.hierarchy;

  const navigate = useNavigate();
  const items: ReactNode[] = [];

  const addItem = (item: ReactNode) => {
    const key = 'SidebarList_' + items.length;
    items.push(<Fragment key={key}>{item}</Fragment>);
  };

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
        const basename = nodePath[nodePath.length - 1];
        if (basenameIsSourceFile(basename)) {
          addItem(
            <SidebarEntityList
              nameComponent={nameComponent}
              marginLeft={extraMargin}
              sourceFilePath={nodePath}
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

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      <Box flex={1}>
        {contentIndex ? (
          <SidebarList contentIndex={contentIndex} />
        ) : (
          <>Loading...</>
        )}
      </Box>
    </Box>
  );
}
