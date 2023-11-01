import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { CrumbSequence } from '@/components/project/crumb-sequence';
import { rightFacingArrow } from '@/components/project/special-strings';
import { accessPathHierarchyNode } from '@common/filesystem';
import { basenameIsSourceFile } from '@/lib/source-files';
import { pageFacingUp, fileFolder } from '@/components/project/special-strings';
import { linkCss } from '@/css/link';
import { useCrumbs } from '@/hooks/useCrumbs';

export interface SubpageDirectoryProps {}
function ItemLink({
  name,
  itemType,
  path,
}: {
  name: string;
  itemType: 'file' | 'directory';
  path: string[];
}) {
  const navigate = useNavigate();
  return (
    <Text
      css={linkCss}
      onClick={() => {
        navigate(path.join('/'));
      }}
    >
      {itemType === 'file' ? pageFacingUp : fileFolder}&nbsp;{name}
    </Text>
  );
}

export function SubpageDirectory({}: SubpageDirectoryProps) {
  const navigate = useNavigate();
  const contentIndex = usePopulateContentIndex();
  const crumbs = useCrumbs();
  if (!contentIndex) {
    return <>Loading...</>;
  }
  const node = accessPathHierarchyNode(
    contentIndex.hierarchy,
    crumbs.containingDirectory.concat([crumbs.basename])
  );
  const names = Object.keys(node.children);
  return (
    <>
      <Box
        width="100%"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        gap="0.5em"
        borderBottom="1px solid black"
      >
        <Text fontSize="xl">Index Of:</Text>
        <CrumbSequence
          onNavigate={(path: string[]) => {
            navigate(path.join('/'));
          }}
          sep={rightFacingArrow}
          path={crumbs.containingDirectory.concat([crumbs.basename])}
        />
      </Box>
      <Box width="100%">
        <ul>
          {names.map((name, i) => {
            return (
              <li key={i}>
                <ItemLink
                  name={name}
                  itemType={basenameIsSourceFile(name) ? 'file' : 'directory'}
                  path={crumbs.containingDirectory.concat([
                    crumbs.basename,
                    name,
                  ])}
                />
              </li>
            );
          })}
        </ul>
      </Box>
    </>
  );
}
