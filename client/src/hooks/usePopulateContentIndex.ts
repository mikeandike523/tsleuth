import { useEffect } from 'react';

import { useRecoilState } from 'recoil';

import { contentIndexState } from '@/atoms/content-index';
import { fetchJSONContent } from '@/lib/fetch-content';
import { ContentIndex } from '@/lib/content-index';
import { useLoadingTaskManager } from '@/components/project/simple-loading-barrier';

export function usePopulateContentIndex(onError?: (error: unknown) => void) {
  const [contentIndex, setContentIndex] = useRecoilState(contentIndexState);
  // @delete {
  console.log(contentIndex);
  // } @delete
  const loadingTaskManager = useLoadingTaskManager();
  // No second argument = silent loading task, only shows spinner no message
  const loadingTask = loadingTaskManager.useTask('usePopulateContentIndex');
  const fetchRoutine = async () => {
    try {
      loadingTask.begin();
      const content =
        await fetchJSONContent<ContentIndex>('content-index.json');
      setContentIndex(content);
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.log(error);
      }
    } finally {
      loadingTask.end();
    }
  };
  useEffect(() => {
    if (contentIndex === null) {
      fetchRoutine();
    }
  }, [contentIndex === null]);

  return contentIndex;
}
