import React from 'react';

import { css } from '@emotion/react';

import { Overview, OverviewEntry } from '<^w^>/lib/site-generation/overview';
import { Box } from './styled/box';
import { Anchor } from './styled/anchor';
import { UUIDContext } from '<^w^>/lib/utils/uuid-context';
import { getGlobalUUIDMapper } from '<^w^>/lib/utils/global-uuid-mapper';
import { Button } from './styled/button';

const plusEmoji = '\u2795';
const minusEmoji = '\u2796';

const pageFacingUpWithCurlEmoji = '\u{1F4C3}';
const openFolderEmoji = '\u{1F4C2}';

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
  display: block;
  white-space: nowrap;
  overflow: hidden;
  margin-left: 2em;
`;

const buttonCss = css`
  background: none;
  cursor: pointer;
  color: black;
  text-decoration: none;
  width: 2em;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
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
  const sortedOverview = overview.sort((a, b) => {
    // const key1 = a.filesystemPathSegments.join('/');
    // const key2 = b.filesystemPathSegments.join('/');
    const key1 = a.filesystemPathSegments.slice(0, -1).join('/');
    const key2 = b.filesystemPathSegments.slice(0, -1).join('/');
    return key1.localeCompare(key2);
  });

  const subOverviews = new Map<string, Overview>();
  for (const entry of sortedOverview) {
    const filesystemPathSegments = entry.filesystemPathSegments;
    const key = filesystemPathSegments.join('/');
    if (!subOverviews.has(key)) {
      subOverviews.set(key, []);
    }
    subOverviews.get(key)?.push(entry);
  }

  const globalUUIDMapper = getGlobalUUIDMapper();

  let parentString = '';

  const anchorSimulationJS = `
document.addEventListener('DOMContentLoaded', function() {
    const simulatedAnchors = document.querySelectorAll('[data-simulated-anchor]');

    simulatedAnchors.forEach(anchor => {
        anchor.addEventListener('click', () => {
            const href = anchor.getAttribute('data-href');
            if (href) {
                window.location.href = href;
            }
        });
    });
});
  `;

  return (
    <>
      <Box
        data-uuid-domain="overview-sidebar-scrollable"
        data-uuid={globalUUIDMapper.getFor(
          'overview-sidebar-scrollable',
          'root'
        )}
        css={css`
          height: 100vh;
          overflow-y: auto;
        `}
      >
        {Array.from(subOverviews.keys()).map((key, i) => {
          const reactKey = key + '_' + i;

          const newParentString = key.split('/').slice(0, -1).join('/');

          const fullSourceCodeHref = '/' + key + '.html' + '#full_source_code';

          const retval = (
            <>
              {newParentString !== parentString && (
                <div
                  style={{
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <div
                    data-uuid-domain="text-truncatable"
                    data-uuid={globalUUIDMapper.getFor(
                      'text-truncatable',
                      key + '_filepath_parent_dirs'
                    )}
                    style={{
                      width: '100%',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      overflow: 'hidden',
                      background: 'khaki',
                      marginLeft: '2em',
                    }}
                    title={key.split('/').slice(0, -1).join('/')}
                  >
                    {key.split('/').slice(0, -1).join('/')}
                  </div>
                  <Button
                    css={buttonCss}
                    style={{
                      position: 'absolute',
                      top: '-0.20em',
                      left: 0,
                    }}
                    title={`Open Folder "${newParentString}"`}
                    data-href={('/' + newParentString + '/index.html').replace(
                      /\/+/g,
                      '/'
                    )}
                    data-simulated-anchor
                  >
                    {openFolderEmoji}
                    <span
                      style={{
                        visibility: 'hidden',
                      }}
                    >
                      M
                    </span>
                  </Button>
                </div>
              )}

              <div
                style={{
                  position: 'relative',
                }}
              >
                <Button
                  css={buttonCss}
                  className={buttonCss.name}
                  style={{
                    position: 'absolute',
                    top: '-0.0625em',
                    left: 0,
                  }}
                  title="View Full Source Code"
                  data-href={fullSourceCodeHref}
                  data-simulated-anchor
                >
                  {pageFacingUpWithCurlEmoji}
                </Button>

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
                      width: '100%',
                      whiteSpace: 'nowrap',
                      background: 'cyan',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                    title={key.split('/').slice(-1)[0]}
                  >
                    <span data-role="icon">{plusEmoji}</span>
                    &nbsp;
                    <span data-role="label">{key.split('/').slice(-1)[0]}</span>
                  </summary>
                  <div
                    style={{
                      position: 'relative',
                    }}
                  ></div>
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
              </div>
            </>
          );

          if (newParentString !== parentString) {
            parentString = newParentString;
          }

          return retval;
        })}
      </Box>
      <script dangerouslySetInnerHTML={{ __html: anchorSimulationJS }}></script>
    </>
  );
}
