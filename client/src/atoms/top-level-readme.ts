import { atom } from 'recoil';

/**
 * Normally, only source code files are shown in the sidebar.
 * Here, the top level readme is given special treatment and is shown and is also the content of the main page (HashRouter Route "/")
 * In the future, it would be nice to recursively load and identify README files per directory, but that is not part of the MVP
 */
export const topLevelReadmeState = atom<string | null>({
  key: 'topLevelReadmeState',
  default: null,
});
