import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { Box, Text } from '@chakra-ui/react';
import { keyframes } from '@chakra-ui/react';
import { css } from '@emotion/react';
import { atom, useRecoilState } from 'recoil';

export interface LoadingTask {
  // Cannot do compile time validation. User must ensure names are unique.
  // Need to do this since we don't want to generate a new uuid on each render
  name: string;
  message?: string;
}

const loadingTasksState = atom({
  key: 'loadingTasksState',
  default: [] as LoadingTask[],
});

export function useLoadingTaskManager() {
  const [loadingTasks, setLoadingTasks] = useRecoilState(loadingTasksState);

  const addLoadingTask = (task: LoadingTask) => {
    setLoadingTasks([...loadingTasks, task]);
  };

  const removeLoadingTask = (name: string) => {
    setLoadingTasks(loadingTasks.filter((task) => task.name !== name));
  };

  const setLoadingTasksMessage = (name: string, message?: string) => {
    setLoadingTasks(
      loadingTasks.map((task) => {
        if (task.name !== name) {
          return task;
        }
        return { ...task, message };
      })
    );
  };

  const removeLoadingTaskMessage = (name: string) => {
    setLoadingTasksMessage(name, undefined);
  };

  const getActiveTasks = () => {
    return loadingTasks;
  };

  const hasActiveTasks = () => {
    return getActiveTasks().length > 0;
  };

  const hasTask = (name: string) => {
    return getActiveTasks().some((task) => task.name === name);
  };

  const getActiveIds = () => {
    return getActiveTasks().map((task) => task.name);
  };

  const useTask = (name: string, initialMessage?: string) => {
    const initialTask = {
      name,
      message: initialMessage,
    };
    const begin = () => {
      if (!hasTask(name)) {
        addLoadingTask(initialTask);
      }
    };
    const updateMessage = (newMessage: string) => {
      setLoadingTasksMessage(name, newMessage);
    };
    const end = () => {
      removeLoadingTask(name);
    };
    return {
      name,
      begin,
      updateMessage,
      end,
    };
  };

  return {
    loadingTasks,
    addLoadingTask,
    removeLoadingTask,
    useTask,
    removeLoadingTaskMessage,
    hasActiveTasks,
  };
}

const loadingBarrierDefaultZIndex = 10000;

function LoadingSpinner() {
  const animation = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `;
  const spinnerCss = css`
    width: 10vh;
    height: 10vh;
    border-radius: 50%;
    border: 0.25em solid #00ffff80;
    border-top: 0.25em solid #3498db;
    animation: ${animation} 1s linear infinite;
  `;
  return <Box css={spinnerCss} flex={0}></Box>;
}

export function LoadingBarrierNoUnmount({
  explicitZIndex,
}: {
  explicitZIndex?: number;
}) {
  const { loadingTasks, hasActiveTasks } = useLoadingTaskManager();

  const blocker = (
    <Box
      position="fixed"
      width="100vw"
      height="100vh"
      margin={0}
      padding={0}
      background="lightgray"
      display={hasActiveTasks() ? 'flex' : 'none'}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      zIndex={explicitZIndex || loadingBarrierDefaultZIndex}
    >
      <Box width="100%" flex={1}>
        <Text width="100%" textAlign="center" as="h1" fontSize="2xl">
          Loading
        </Text>
      </Box>
      {/* Matches the exact spinner in index.html used while waiting for React app to load/hydrate */}
      <LoadingSpinner />
      <Box width="100%" flex={1}>
        <Text
          width="100%"
          textAlign="center"
          as="h2"
          fontSize="lg"
          whiteSpace="pre-wrap"
        >
          {loadingTasks
            .filter((task) => task.message)
            .map((task) => {
              return task.message;
            })
            .join('\n')}
        </Text>
      </Box>
    </Box>
  );
  return blocker;
}
