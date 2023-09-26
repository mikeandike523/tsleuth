import React from 'react';

import { css } from '@emotion/react';

import { Overview, OverviewEntry } from '<^w^>/lib/site-generation/overview';
import { Box } from './styled/box';
import { Anchor } from './styled/anchor';
import { UUIDContext } from '<^w^>/lib/utils/uuid-context';
import { getGlobalUUIDMapper } from '<^w^>/lib/utils/global-uuid-mapper';

const plusEmoji = '\u2795';
const minusEmoji = '\u2796';

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
  margin-left: 2em;
`;

export function OverviewSidebarItem({ entry }: { entry: OverviewEntry }) {
  const globalUUIDMapper = getGlobalUUIDMapper();

  const href =
    '/' +
    entry.filesystemPathSegments.join('/') +
    '.html' +
    '#' +
    entry.uuidInSourceFile;

  return (
    <Anchor
      data-uuid-domain="text-truncatable"
      data-uuid={globalUUIDMapper.getFor(
        'text-truncatable',
        '_module_link_' + href
      )}
      css={aCss}
      href={href}
      title={entry.symbolPathSegments.join('\u2192')}
    >
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

  let parentString = '';

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

        const newParentString = key.split('/').slice(0, -1).join('/');

        const retval = (
          <>
            {newParentString !== parentString && (
              <div
                data-uuid-domain="text-truncatable"
                data-uuid={globalUUIDMapper.getFor(
                  'text-truncatable',
                  key + '_filepath_parent_dirs'
                )}
                style={{
                  width: '20vw',
                  maxWidth: '20vw',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  overflow: 'hidden',
                  background: 'khaki',
                }}
                title={key.split('/').slice(0, -1).join('/')}
              >
                {key.split('/').slice(0, -1).join('/')}
              </div>
            )}

            <details
              data-uuid-domain="overview-sidebar-details"
              data-uuid={globalUUIDMapper.getFor(
                'overview-sidebar-details',
                key
              )}
              style={{
                display: 'block',
                overflow: 'hidden',
              }}
              key={reactKey}
            >
              <summary
                data-toggle="toggle"
                data-uuid-domain="text-truncatable"
                data-uuid={globalUUIDMapper.getFor(
                  'text-truncatable',
                  key + '_filepath_basename'
                )}
                style={{
                  userSelect: 'none',
                  marginLeft: '2em',
                  width: '20vw',
                  maxWidth: '20vw',
                  whiteSpace: 'nowrap',
                  background: 'cyan',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  overflow: 'hidden',
                }}
                title={key.split('/').slice(-1)[0]}
              >
                <span data-role="icon">{plusEmoji}</span>
                &nbsp;
                <span data-role="label">{key.split('/').slice(-1)[0]}</span>
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
          </>
        );

        if (newParentString !== parentString) {
          parentString = newParentString;
        }

        return retval;
      })}
    </Box>
  );
}
