import React, { ReactNode } from 'react';

export function Navbar({
  outDir,
  crumbs,
}: {
  outDir: string;
  crumbs: string[];
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
        }}
      >
        {(() => {
          const items: ReactNode[] = [];
          const getLength = () => {
            return items.length;
          };
          items.push(
            <a key={getLength()} href={outDir + '/index.html'}>
              [/]
            </a>
          );
          if (crumbs.length > 0) {
            items.push(<div key={getLength()}>&gt;&gt;</div>);
          }

          for (let i = 0; i < crumbs.length; i++) {
            items.push(
              <a
                key={getLength()}
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
    </>
  );
}
