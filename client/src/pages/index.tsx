import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { useState, useEffect } from 'react';

import { Box } from '@chakra-ui/react';

import { Page } from '@/components/project/page';
import { fetchJSONContent, fetchTextContent } from '@/lib/fetch-content';
import { SerializableObject } from '@common/serialization';
import { ContentIndex } from '@/lib/content-index';

export default function Home() {
  const [projectName, setProjectName] = useState<string | null>(null);
  const [readmeFile, setReadmeFile] = useState<string | null>(null);
  const [contentIndex, setContentIndex] = useState<ContentIndex | null>(null);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (
        projectName === null ||
        readmeFile === null ||
        contentIndex === null ||
        readmeContent === null
      ) {
        try {
          const contentIndex = (await fetchJSONContent(
            'content-index.json'
          )) as ContentIndex;
          setProjectName(contentIndex.projectName);
          setReadmeFile(contentIndex.topLevelReadme);
          setContentIndex(contentIndex);
          if (contentIndex.topLevelReadme !== null) {
            const readmeContent = (
              await fetchTextContent(contentIndex.topLevelReadme)
            ).trim();
            setReadmeContent(readmeContent);
          } else {
            setReadmeContent('');
          }
        } catch (e) {
          // For now, need to improve soon
          console.log(e);
        }
      }
    })();
  }, [projectName, readmeFile, contentIndex, readmeContent]);

  return (
    <Page projectName={projectName ?? 'Loading...'}>
      {readmeContent && (
        <Box width="100%" background="grey" whiteSpace="pre-wrap">
          {readmeContent}
        </Box>
      )}
    </Page>
  );
}
