import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box } from '@chakra-ui/react';

import { useCrumbs } from '@/hooks/useCrumbs';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { accessPathHierarchyNodeData } from '@common/filesystem';

export interface SubpageFileProps {}

export function SubpageFile({}: SubpageFileProps) {
  const crumbs = useCrumbs();
  const contentIndex = usePopulateContentIndex();
  console.log(contentIndex, crumbs);

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

  return (
    <Box width="100%" height="100%">
      {intermediateFile}
    </Box>
  );
}
