import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { useState, useEffect } from 'react';

import { Box, Text } from '@chakra-ui/react';
import remarkGfm from 'remark-gfm';
import Markdown from 'react-markdown';

import { Page } from '@/components/project/page';
import { usePopulateTopLevelReadme } from '@/hooks/usePopulateTopLevelReadme';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { usePopulateProjectName } from '@/hooks/usePopulateProjectName';

export default function Home() {
  const contentIndex = usePopulateContentIndex();
  const topLevelReadmeContent = usePopulateTopLevelReadme();
  const projectName = usePopulateProjectName();
  return (
    <Page>
      <Text as="h1">Project: {projectName ?? 'Loading...'}</Text>
      <Box
        width="100%"
        marginTop="0.125em"
        marginBottom="0.125em"
        background="black"
        height="0.0625em"
      ></Box>
      {contentIndex?.topLevelReadme ? (
        <Box width="100%" background="lightgray" whiteSpace="pre-wrap">
          {topLevelReadmeContent ? (
            <>
              {contentIndex.topLevelReadme.toLowerCase().endsWith('.md') ? (
                <>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {topLevelReadmeContent}
                  </Markdown>
                </>
              ) : (
                topLevelReadmeContent
              )}
            </>
          ) : (
            'Loading...'
          )}
        </Box>
      ) : (
        <Box
          width="100%"
          background="lightgray"
          textStyle="underline"
          whiteSpace="pre-wrap"
        >
          No README file (.md or .txt, case insensitive)
        </Box>
      )}
    </Page>
  );
}
