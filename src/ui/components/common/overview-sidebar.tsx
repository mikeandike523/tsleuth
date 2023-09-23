import React from 'react';

import { css } from '@emotion/react';

import { Overview, OverviewEntry } from '<^w^>/lib/site-generation/overview';
import { Box } from './styled/box';
import { Anchor } from './styled/anchor';
import { UUIDContext } from '<^w^>/lib/utils/uuid-context';
import { getGlobalUUIDMapper } from '<^w^>/lib/utils/global-uuid-mapper';

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
    <div style={{}}>
      <Anchor css={aCss} href={href}>
        {entry.symbolPathSegments.join('\u2192')}
      </Anchor>
    </div>
  );
}

export function OverviewSidebar({ overview }: OverviewSidebarProps) {
  const subOverviews = new Map<string, Overview>();
  for (const entry of overview) {
    const filesystemPathSegments = entry.filesystemPathSegments;
    const key = filesystemPathSegments.join('/');
    if (!subOverviews.has(key)) {
      subOverviews.set(key, []);
    }
    subOverviews.get(key)?.push(entry);
  }

  const globalUUIDMapper = getGlobalUUIDMapper();

  return (
    <Box
      css={css`
        height: 100vh;
        overflow-y: auto;
      `}
    >
      {Array.from(subOverviews.keys()).map((key, i) => {
        const reactKey = key + '_' + i;
        return (
          <details
            data-uuid-domain="overview-sidebar-details"
            data-uuid={globalUUIDMapper.getFor('overview-sidebar-details', key)}
            style={{
              border: '1px solid black',
              marginTop: '0.25em',
              marginBottom: '0.25em',
              marginLeft: '6px',
              marginRight: '6px',
            }}
            key={reactKey}
          >
            <summary
              style={{
                width: '100',
                background: 'khaki',
                textOverflow: 'ellipsis',
              }}
            >
              {key}
            </summary>
            {(() => {
              const covered = new Set<string>();

              const items = [];

              let counter = 0;

              for (const entry of subOverviews.get(key)!) {
                if (!covered.has(entry.uuidInSourceFile)) {
                  covered.add(entry.uuidInSourceFile);
                  items.push(
                    <OverviewSidebarItem
                      key={reactKey + '_entry' + counter++}
                      entry={entry}
                    />
                  );
                }
              }

              return items;
            })()}
          </details>
        );
      })}
    </Box>
  );
}
