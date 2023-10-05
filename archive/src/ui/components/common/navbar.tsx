import React, { ReactNode } from 'react';
import { css } from '@emotion/react';

import { Anchor } from '<^w^>/ui/components/common/styled/anchor';

const aCss = css`
  text-decoration: none;
  color: black;
  &:hover {
    text-decoration: underline;
  }
  &:visited {
    color: black;
  }
`;

export function Navbar({
  outDir,
  crumbs,
  isIndexPage,
}: {
  outDir: string;
  crumbs: string[];
  isIndexPage: boolean;
}) {
  return (
    <>
      {/* navbar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          fontSize: '2em',
          fontWeight: 'bold',
          borderBottom: '2px dashed black',
          background: 'khaki',
        }}
      >
        {(() => {
          const items: ReactNode[] = [];
          const getLength = () => {
            return items.length;
          };
          items.push(
            <Anchor css={aCss} key={getLength()} href={'/index.html'}>
              [/]
            </Anchor>
          );
          if (crumbs.length > 0) {
            items.push(<div key={getLength()}>&gt;&gt;</div>);
          }

          for (let i = 0; i < crumbs.length; i++) {
            items.push(
              <Anchor
                css={aCss}
                key={getLength()}
                href={
                  '/' +
                  (crumbs.slice(0, i + 1).join('/') +
                    (i === crumbs.length - 1
                      ? isIndexPage
                        ? '/index.html'
                        : '.html'
                      : '/index.html'))
                }
              >
                {crumbs[i]}
              </Anchor>
            );
            if (i < crumbs.length - 1) {
              items.push(<div key={i}>&gt;&gt;</div>);
            }
          }
          return <>{items}</>;
        })()}
      </div>
    </>
  );
}
