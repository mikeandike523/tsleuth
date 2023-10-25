import { atom } from 'recoil';

import { ContentIndex } from '@/lib/content-index';

export const contentIndexState = atom<ContentIndex | null>({
  key: 'contentIndexState',
  default: null,
});
