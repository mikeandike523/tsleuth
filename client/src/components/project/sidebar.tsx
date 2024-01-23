import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import {
  ReactNode,
  useState,
  useRef,
  useEffect,
  MutableRefObject,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Input } from '@chakra-ui/react';
import ts from 'typescript';
import * as uuid from 'uuid';
import { throttle } from 'lodash';

import { linkCss } from '@/css/link';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { ContentIndex } from '@/lib/content-index';
import { basenameIsSourceFile } from '@/lib/source-files';
import { PathHierarchyNode } from '@common/filesystem';
import { SidebarEntityList } from './sidebar-entity-list';
import { fileFolder, pageFacingUp } from './special-strings';
import { retrieveASTIntermediateFromContentIndex } from '@/hooks/useASTIntermediate';
import { SerializableASTNode } from '@cli/lib/ast-traversal';
import { getSearchMatches } from '@common/search';

export interface SidebarProps {}

export function SidebarList({
  contentIndex,
  symbolList,
  searchQuery,
  getHideMap,
}: {
  contentIndex: ContentIndex;
  symbolList: Set<string>;
  searchQuery: string;
  getHideMap: () => Map<string, boolean>;
}) {
  const hierarchy = contentIndex.hierarchy;

  const navigate = useNavigate();
  const items: ReactNode[] = [];

  const addItemIfShouldShow = (item: ReactNode, nodePath: Array<string>) => {
    const key = 'SidebarList_' + items.length;
    const id = nodePath.join('/');
    items.push(
      <Box display={getHideMap().get(id) ?? false ? 'none' : 'block'} key={key}>
        {item}
      </Box>
    );
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

      const setSearchNoResults = (value: boolean) => {};

      if (nodePath.length > 0) {
        const basename = nodePath[nodePath.length - 1];
        if (basenameIsSourceFile(basename)) {
          addItemIfShouldShow(
            <SidebarEntityList
              setSearchNoResults={setSearchNoResults}
              nameComponent={nameComponent}
              marginLeft={extraMargin}
              sourceFilePath={nodePath}
              symbolList={symbolList}
              searchQuery={searchQuery}
            />,
            nodePath
          );
        } else {
          addItemIfShouldShow(nameComponent, nodePath);
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

  const [, setHideMapStringified] = useState<string>(JSON.stringify([]));

  const hideMapRef: MutableRefObject<Map<string, boolean> | null> = useRef<Map<
    string,
    boolean
  > | null>(null);

  useEffect(() => {
    if (hideMapRef.current === null) {
      hideMapRef.current = new Map();
    }
  }, [hideMapRef.current]);

  const getHideMap = () => {
    const current = hideMapRef.current;
    if (current === null) {
      hideMapRef.current = new Map();
    }
    return hideMapRef.current as Map<string, boolean>;
  };

  const tryUpdateHideMap = () => {
    setHideMapStringified(JSON.stringify(Array.from(getHideMap().entries())));
  };

  const taskUuidRef: MutableRefObject<string | null> = useRef<string | null>(
    null
  );

  const updateSearchTask = useCallback(
    async (taskId: string) => {
      if (taskId !== taskUuidRef.current) {
        return;
      }
      getHideMap().clear();
      const visit = async (
        indexNode: ContentIndex['hierarchy'],
        path: string[]
      ) => {
        if (!contentIndex) {
          return;
        }
        if (path.length > 0) {
          if (basenameIsSourceFile(path[path.length - 1])) {
            const data = indexNode.data;
            if (typeof data !== 'undefined') {
              const intermediate =
                await retrieveASTIntermediateFromContentIndex(
                  contentIndex,
                  path
                );
              if (intermediate !== null) {
                const rootNode = intermediate.root;
                if (rootNode !== null) {
                  const foundNames: string[] = [];
                  const astVisitor = (node: SerializableASTNode) => {
                    if (node.kind !== ts.SyntaxKind.SourceFile) {
                      foundNames.push(node.name ?? '[[anonymous]]');
                    }
                    for (const child of node.children) {
                      astVisitor(child);
                    }
                  };
                  astVisitor(rootNode);
                  let hasAny = false;
                  for (const foundName of foundNames) {
                    const matches = getSearchMatches(searchQuery, foundName);
                    if (matches.length > 0) {
                      hasAny = true;
                      break;
                    }
                  }
                  if (!hasAny) {
                    for (
                      let iSegment = path.length - 1;
                      iSegment >= 0;
                      iSegment--
                    ) {
                      const through = path.slice(0, iSegment + 1);
                      const id = through.join('/');

                      if (!getHideMap().has(id)) {
                        getHideMap().set(id, true);
                      }
                    }
                  } else {
                    for (
                      let iSegment = path.length - 1;
                      iSegment >= 0;
                      iSegment--
                    ) {
                      const through = path.slice(0, iSegment + 1);
                      const id = through.join('/');

                      getHideMap().set(id, false);
                    }
                  }
                }
              }
            }
          }
        }

        for (const childKey of Object.keys(indexNode.children)) {
          const child = indexNode.children[childKey]!;
          await visit(
            child as ContentIndex['hierarchy'],
            path.concat([childKey])
          );
        }
      };
      await visit((contentIndex as ContentIndex).hierarchy, []);
      tryUpdateHideMap();
    },
    [searchQuery]
  );

  const search = () => {
    if (searchQuery !== '') {
      const id = uuid.v4();
      taskUuidRef.current = id;
      updateSearchTask(id);
    } else {
      getHideMap().clear();
      tryUpdateHideMap();
    }
  };

  useEffect(() => {
    search();
  }, [searchQuery]);
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      <Box width="100%">
        <Input
          placeholder="Filter Symbols"
          type="text"
          width="100%"
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              search();
            }
          }}
        />
      </Box>
      <Box flex={1}>
        {contentIndex ? (
          <SidebarList
            getHideMap={getHideMap}
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
