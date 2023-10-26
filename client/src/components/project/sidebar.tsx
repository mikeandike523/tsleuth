import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box } from '@chakra-ui/react';
import { throttle } from 'lodash';

import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { ContentIndex } from '@/lib/content-index';
import { PathHierarchyNode } from '@common/filesystem';
import { linkCss } from '@/css/link';

export interface SidebarProps {}

export function SidebarList({ contentIndex }: { contentIndex: ContentIndex }) {
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
    const margin = 2 * level + 'em';
    const url = `${nodePath.join('/')}`;
    if (level > 0) {
      addItem(
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="flex-start"
        >
          <Box
            height="1.5em"
            width={margin}
            color="transparent"
            background="skyblue"
          ></Box>
          <Box
            onClick={() => {
              navigate(url);
            }}
            css={linkCss}
            height="1.5em"
            lineHeight="1.5em"
            background="khaki"
          >
            {node.segment}
          </Box>
        </Box>
      );
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

  // Unfortunately, css doesn't respond well to combining flexbox and overflow
  // The traditional solution is to first render without the change of overflow (i.e. dont render the sidebar list), measure the boundingClientRect, and then set the height to explicit
  const [renderedHeight, setRenderedHeight] = useState<number | null>(null);

  const outerBoxRef = useRef<HTMLDivElement | null>(null);

  const handleResize = throttle(function () {
    setRenderedHeight(null);
  }, 250);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (outerBoxRef.current) {
      setRenderedHeight(outerBoxRef.current.getBoundingClientRect().height);
    }
  }, [renderedHeight]);

  const cssHeight = renderedHeight !== null ? `${renderedHeight}px` : `100%`;

  return (
    <Box
      height={cssHeight}
      maxHeight={cssHeight}
      borderRight="2px solid black"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      overflowY="auto"
      ref={outerBoxRef}
    >
      {contentIndex ? (
        <>
          {renderedHeight !== null ? (
            <SidebarList contentIndex={contentIndex} />
          ) : (
            <></>
          )}
        </>
      ) : (
        <>Loading...</>
      )}
    </Box>
  );
}
