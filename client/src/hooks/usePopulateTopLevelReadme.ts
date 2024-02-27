import { useEffect } from 'react';

import { useRecoilState } from 'recoil';

import { usePopulateContentIndex } from './usePopulateContentIndex';
import { fetchTextContent } from '@/lib/fetch-content';
import { ContentIndex } from '@/lib/content-index';
import { topLevelReadmeState } from '@/atoms/top-level-readme';
import { useLoadingTaskManager } from '@/components/project/simple-loading-barrier';

export function usePopulateTopLevelReadme(onError?: (error: unknown) => void) {
  const loadingTaskManager = useLoadingTaskManager();
  // No second argument means silent loading task, only shows spinner no message
  const loadingTask = loadingTaskManager.useTask('usePopulateTopLevelReade');
  const contentIndex: ContentIndex | null = usePopulateContentIndex();
  const [topLevelReadme, setTopLevelReadme] =
    useRecoilState(topLevelReadmeState);
  const fetchRoutine = async () => {
    try {
      loadingTask.begin();
      const readmeFilename = (contentIndex as ContentIndex).topLevelReadme;
      if (readmeFilename !== null) {
        const textContent = await fetchTextContent(readmeFilename);
        setTopLevelReadme(textContent);
      }
    } catch (e) {
      if (onError) {
        onError(e);
      } else {
        console.log(e);
      }
    } finally {
      loadingTask.end();
    }
  };
  useEffect(() => {
    if (
      contentIndex !== null &&
      contentIndex.topLevelReadme !== null &&
      topLevelReadme === null
    ) {
      fetchRoutine();
    }
  });

  return topLevelReadme;
}
