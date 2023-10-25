import { useEffect } from 'react';

import { useRecoilState } from 'recoil';

import { usePopulateContentIndex } from './usePopulateContentIndex';
import { projectNameState } from '@/atoms/project-name';
import { ContentIndex } from '@/lib/content-index';
import { useLoadingTaskManager } from '@/components/project/simple-loading-barrier';

export function usePopulateProjectName(onError?: (error: unknown) => void) {
  const taskManager = useLoadingTaskManager();
  // No second argument means silent loading task, only shows spinner no message
  // Not really necessary since property access is instant, but it stays consitent with the other "populate" hooks
  const loadingTask = taskManager.useTask('usePopulateProjectName');
  const contentIndex: ContentIndex | null = usePopulateContentIndex(onError);
  const [projectName, setProjectName] = useRecoilState(projectNameState);
  const fetchRoutine = () => {
    // There should not really be any error, but handle it just to stay consistent with the other "populate" hooks
    try {
      loadingTask.begin();
      const projectName = (contentIndex as ContentIndex).projectName;
      setProjectName(projectName);
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
    if (contentIndex !== null && contentIndex && projectName === null) {
      fetchRoutine();
    }
  }, [contentIndex === null, projectName === null]);
  return projectName;
}
