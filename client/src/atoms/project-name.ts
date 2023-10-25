import { atom } from 'recoil';

export const projectNameState = atom<string | null>({
  key: 'projectNameState',
  default: null,
});
