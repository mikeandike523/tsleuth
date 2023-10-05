import React from 'react';

import { css } from '@emotion/react';

import { Overview } from '<^w^>/lib/site-generation/overview';

import { Box, BoxProps } from '<^w^>/ui/components/common/styled/box';

import { OverviewSidebar } from './overview-sidebar';

export interface PageProps extends BoxProps {
  overview: Overview;
}

export function Page({ children, overview }: PageProps) {
  const pageStyle = css`
    width: 100vw;
    height: 100vh;
    overflow: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
  `;

  return (
    <Box css={pageStyle}>
      <Box
        css={css`
          width: 20vw;
          overflow-y: auto;
          border-right: 2px dashed black;
        `}
      >
        <OverviewSidebar overview={overview} />
      </Box>
      <Box
        css={css`
          width: 80vw;
          height: 100vh;
          overflow-y: auto;
        `}
      >
        {children}
      </Box>
    </Box>
  );
}
