import { css } from '@emotion/react';

export const linkCss = css`
  text-decoration: none;
  color: black;
  cursor: pointer;
  user-select: none;
  &:hover {
    text-decoration: underline;
  }
`;
