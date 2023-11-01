import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useCrumbs } from '@/hooks/useCrumbs';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { accessPathHierarchyNodeData } from '@common/filesystem';
import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { CrumbSequence } from '@/components/project/crumb-sequence';
import { rightFacingArrow } from '@/components/project/special-strings';

export interface SubpageFileProps {}

export function SubpageFile({}: SubpageFileProps) {
  const navigate = useNavigate();
  const crumbs = useCrumbs();
  const contentIndex = usePopulateContentIndex();
  const intermediate = useASTIntermediate(
    crumbs.containingDirectory.concat([crumbs.basename]),
    false
  );

  if (!contentIndex) {
    return <>Loading...</>;
  }

  if (crumbs.routeType === 'index' || crumbs.basename === '') {
    return <></>;
  }

  const intermediateFile = accessPathHierarchyNodeData(
    contentIndex.hierarchy,
    crumbs.containingDirectory.concat([crumbs.basename])
  );

  if (!intermediateFile) {
    throw new Error('Corrupted content index');
  }

  if (!intermediate) {
    return <>Loading...</>;
  }

  return (
    <Box width="100%" height="100%">
      <Box
        width="100%"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        gap="0.5em"
        borderBottom="1px solid black"
      >
        <Text fontSize="xl">Symbols Of:</Text>
        <CrumbSequence
          onNavigate={(path: string[]) => {
            navigate(path.join('/'));
          }}
          sep={rightFacingArrow}
          path={crumbs.containingDirectory.concat([crumbs.basename])}
        />
      </Box>
      <Box width="100%">{/* Main Content Goes Here */}</Box>
    </Box>
  );
}
