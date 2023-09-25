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
  width: 20vw;
  max-width: 20vw;
  text-overflow: ellipsis;
  text-decoration: none;
  color: black;
  &:hover {
    text-decoration: underline;
  }
  &:visited {
    color: black;
  }
  display: block;
  white-space: nowrap;
  overflow: hidden;
`;

export function OverviewSidebarItem({ entry }: { entry: OverviewEntry }) {
  const href =
    '/' +
    entry.filesystemPathSegments.join('/') +
    '.html' +
    '#' +
    entry.uuidInSourceFile;

  return (
    <Anchor css={aCss} href={href}>
      {entry.symbolPathSegments.join('\u2192')}
    </Anchor>
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
      data-uuid-domain="overview-sidebar-scrollable"
      data-uuid={globalUUIDMapper.getFor('overview-sidebar-scrollable', 'root')}
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
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              display: 'block',
              overflow: 'hidden',
            }}
            key={reactKey}
          >
            <summary
              style={{
                width: '20vw',
                maxWidth: '20vw',
                whiteSpace: 'nowrap',
                background: 'khaki',
                textOverflow: 'ellipsis',
                display: 'block',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '20vw',
                  maxWidth: '20vw',
                  whiteSpace: 'nowrap',
                  background: 'khaki',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  overflow: 'hidden',
                  fontStyle: 'italic',
                }}
              >
                {key.split('/').slice(0, -1).join('/')}
              </div>
              <div
                style={{
                  width: '20vw',
                  maxWidth: '20vw',
                  whiteSpace: 'nowrap',
                  background: 'khaki',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  overflow: 'hidden',
                  fontWeight: 'bold',
                }}
              >
                {key.split('/').slice(-1)[0]}
              </div>
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
