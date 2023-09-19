import React from 'react';

import { css } from '@emotion/react';

import { Overview, OverviewEntry } from '<^w^>/lib/site-generation/overview';
import { Box } from './styled/box';
import { Anchor } from './styled/anchor';

export type OverviewSidebarProps = {
  overview: Overview;
};

const aCss = css`
  width: 100%;
  text-overflow: ellipsis;
  text-decoration: none;
  color: black;
  &:hover {
    text-decoration: underline;
  }
  &:visited {
    color: black;
  }
`;

export function OverviewSidebarItem({ entry }: { entry: OverviewEntry }) {
  const href =
    '/' +
    entry.filesystemPathSegments.join('/') +
    '.html' +
    '#' +
    entry.uuidInSourceFile;

  return (
    <div
      style={{
        marginTop: '0.25em',
        marginBottom: '0.25em',
        border: '2px solid black',
        height: '100%',
        overflowY: 'auto',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          background: 'khaki',
          textOverflow: 'ellipsis',
        }}
      >
        {entry.filesystemPathSegments.join('/')}
      </div>
      <Anchor
        onClick={() => {
          // If the current url in the history is the same as the href, then try to scroll into view with no easing

          const hrefWithoutLeadingSlash = href.replace(/^\//, '');
          const hrefWithoutTrailingSlash = hrefWithoutLeadingSlash.replace(
            /\/$/,
            ''
          );
          const currentUrlRoute = window.location.pathname;
          const currentUrlWithoutLeadingSlash = currentUrlRoute.replace(
            /^\//,
            ''
          );
          const currentUrlWithoutTrailingSlash =
            currentUrlWithoutLeadingSlash.replace(/\/$/, '');
          if (hrefWithoutTrailingSlash === currentUrlWithoutTrailingSlash) {
            document.getElementById(entry.uuidInSourceFile)?.scrollIntoView({
              behavior: 'auto',
            });
          }
        }}
        css={aCss}
        href={href}
      >
        {entry.symbolPathSegments.join('\u2192')}
      </Anchor>
    </div>
  );
}

export function OverviewSidebar({ overview }: OverviewSidebarProps) {
  return (
    <Box
      css={css`
        height: 100%;
      `}
    >
      {overview.map((entry, i) => {
        return <OverviewSidebarItem key={i} entry={entry} />;
      })}
    </Box>
  );
}
