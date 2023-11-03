import { css, keyframes } from '@emotion/react';

const animation = keyframes`
0% {
  opacity: 1;
}
50% {
  opacity: 0;
}
100% {
  opacity: 1;
}
`;

export function useLookAtMeAnimationCss(
  flashDuration: number,
  flashColor: string
) {
  return css`
    animation: ${animation} ${(flashDuration / 1000).toFixed(4)}s linear
      infinite;
    background: ${flashColor};
  `;
}
