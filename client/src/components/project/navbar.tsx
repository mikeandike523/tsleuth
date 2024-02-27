import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactNode, Fragment } from 'react';

import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';
import { useCrumbs } from '@/hooks/useCrumbs';
import { CrumbSequence } from './crumb-sequence';
import {
  rightFacingSmallTriangle,
  rightFacingArrow,
  doubleColon,
} from './special-strings';
import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { ASTIntermediate, SerializableASTNode } from '@cli/lib/ast-traversal';
import { linkCss } from '@/css/link';
import { basenameIsSourceFile } from '@/lib/source-files';

export interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const navigate = useNavigate();
  const projectName = usePopulateProjectName();
  const crumbs = useCrumbs();
  const astContent = useASTIntermediate(
    crumbs.containingDirectory.concat([crumbs.basename]),
    true
  );

  if (crumbs.routeType === 'file' && !astContent) {
    return <>Loading...</>;
  }

  const items: ReactNode[] = [];
  const addItem = (item: ReactNode) => {
    const key = 'navbar_item_' + items.length;
    items.push(<Fragment key={key}>{item}</Fragment>);
  };
  addItem(
    <Text
      as="h1"
      fontSize="2xl"
      css={linkCss}
      onClick={() => {
        if (projectName) {
          navigate('');
        }
      }}
    >
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
        onNavigate={(path: string[]) => {
          navigate(
            path.join('/') +
              (path.length > 0 &&
                (basenameIsSourceFile(path[path.length - 1])
                  ? '/:/full_source_code'
                  : ''))
          );
        }}
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
      const namedEntityPath: string[] = [];
      if ((astContent as ASTIntermediate).root === null) {
        throw new Error('AST content is empty');
      }
      let unwrapped: SerializableASTNode = (astContent as ASTIntermediate)
        .root as SerializableASTNode;
      if (
        crumbs.entityPath.length === 1 &&
        crumbs.entityPath[0] === 'full_source_code'
      ) {
        namedEntityPath.push('Full Source Code');
      } else {
        for (const entityId of crumbs.entityPath) {
          const child = unwrapped.children.find(
            (child) => child.id === entityId
          );
          if (!child) {
            return (
              <Box>Invalid entity path: {crumbs.entityPath.join('::')}</Box>
            );
          }
          namedEntityPath.push(child.name ?? '[[anonymous]]');
          unwrapped = child;
        }
      }

      addItem(
        <CrumbSequence
          sep={doubleColon}
          path={namedEntityPath}
          prepend={true}
        />
      );
    }
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="row"
      alignItems="center"
      background="skyblue"
      gap="0.5em"
      borderBottom="2px solid black"
      height="64px"
      paddingLeft="8px"
    >
      {items}
    </Box>
  );
}
