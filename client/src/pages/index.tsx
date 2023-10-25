import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { useState, useEffect } from 'react';

import { Box } from '@chakra-ui/react';

import { Page } from '@/components/project/page';
import { usePopulateTopLevelReadme } from '@/hooks/usePopulateTopLevelReadme';

export default function Home() {
  const topLevelReadme = usePopulateTopLevelReadme();
  return (
    <Page>
      {topLevelReadme && (
        <Box width="100%" background="grey" whiteSpace="pre-wrap">
          {topLevelReadme}
        </Box>
      )}
    </Page>
  );
}
