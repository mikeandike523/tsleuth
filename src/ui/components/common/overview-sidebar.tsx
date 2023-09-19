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

  const hrefWithoutLeadingSlash = href.replace(/^\//, '');
  const hrefWithoutTrailingSlash = hrefWithoutLeadingSlash.replace(/\/$/, '');

  const hrefId =
    'navto_' +
    hrefWithoutTrailingSlash
      .replace(/\//g, '_fslash_')
      .replace(/:/g, '_colon_')
      .replace(/#/g, '_pound_');
  return (
    <div style={{}}>
      <Anchor
        id={hrefId}
        onClick={() => {
          // If the current url in the history is the same as the href, then try to scroll into view with no easing

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
            document.getElementById(hrefId)?.scrollIntoView({
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
  const subOverviews = new Map<string, Overview>();
  for (const entry of overview) {
    const filesystemPathSegments = entry.filesystemPathSegments;
    const key = filesystemPathSegments.join('/');
    if (!subOverviews.has(key)) {
      subOverviews.set(key, []);
    }
    subOverviews.get(key)?.push(entry);
  }

  const js = `
  if(!window.scrollToListenerEstablished){
    window.scrollToListenerEstablished = true;
    document.addEventListener('DOMContentLoaded', () => {
      // Check if there is a hash in the url
      const hash = window.location.hash;
      if(hash){
        const uuid = hash
        const href =
        '/' +
        window.location.pathname.replace(/^\\/+/g,'').replace(/\\/+$/g,'') +
        '.html' +
        '#' +
        uuid;
    
        const hrefWithoutLeadingSlash = href.replace(/^\\//, '');
        const hrefWithoutTrailingSlash = hrefWithoutLeadingSlash.replace(/\\$/,'');
    
        const hrefId = 'navto_' + hrefWithoutTrailingSlash.replace(/\\//g, '_fslash_').replace(/:/g, '_colon_').replace(/#/g, '_pound_');
        
        const elem1 = document.getElementById(uuid)
        const elem2 = document.getElementById(hrefId)

        if(elem1){
          elem1.scrollIntoView({
            behavior: 'auto',
          })
        }
        if(elem2){
          elem2.scrollIntoView({
            behavior: 'auto',
          })
        }
      }
    })
  }
  `;
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
          <div
            style={{
              border: '1px solid black',
              marginTop: '0.25em',
              marginBottom: '0.25em',
              marginLeft: '6px',
              marginRight: '6px',
            }}
            key={reactKey}
          >
            <div
              style={{
                width: '100',
                background: 'khaki',
                textOverflow: 'ellipsis',
              }}
            >
              {key}
            </div>
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
          </div>
        );
      })}
      <script
        dangerouslySetInnerHTML={{
          __html: js,
        }}
      ></script>
    </Box>
  );
}
