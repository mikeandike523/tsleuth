import React, { ReactNode } from 'react';

import { SymbolDetails } from '<^w^>/lib/utils/ast';

export interface MainLayoutProps {
  crumbs: string[];
  symbols: SymbolDetails[];
  outDir: string;
}

export function MainLayout({ crumbs, outDir, symbols }: MainLayoutProps) {
  return (
    <div
      style={{
        width: '100%',
      }}
    >
      {/* navbar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {(() => {
          const items: ReactNode[] = [];
          for (let i = 0; i < crumbs.length; i++) {
            items.push(
              <a
                key={i}
                href={
                  outDir +
                  '/' +
                  (crumbs.slice(0, i + 1).join('/') +
                    (i === crumbs.length - 1 ? '.html' : '/index.html'))
                }
              >
                {crumbs[i]}
              </a>
            );
            if (i < crumbs.length - 1) {
              items.push(<div key={i}>&gt;&gt;</div>);
            }
          }
          return <>{items}</>;
        })()}
      </div>
    </div>
  );
}
