import React, { ReactNode } from 'react';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Navbar } from '../common/navbar';
import { Overview } from '<^w^>/lib/site-generation/overview';
import { Page } from '../common/page';
import { getGlobalUUIDMapper } from '<^w^>/lib/utils/global-uuid-mapper';

export interface MainLayoutProps {
  crumbs: string[];
  listing: {
    name: string;
    isLeaf: boolean;
  }[];
  outDir: string;
  overview: Overview;
}

export function MainLayout({
  overview,
  crumbs,
  outDir,
  listing,
}: MainLayoutProps) {
  const globalUUIDMapper = getGlobalUUIDMapper();

  const filenames = listing.filter((l) => l.isLeaf).map((l) => l.name);
  const dirnames = listing.filter((l) => !l.isLeaf).map((l) => l.name);

  const getFilenameUrl = (filename: string) => {
    return (
      ('/' + crumbs.join('/') + '/' + filename + '.html').replace(/\/+/g, '/') +
      '#full_source_code'
    );
  };

  const getDirnameUrl = (dirname: string) => {
    return ('/' + crumbs.join('/') + '/' + dirname + '/index.html').replace(
      /\/+/g,
      '/'
    );
  };

  const content = (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 0 }}>
        <Navbar crumbs={crumbs} outDir={outDir} isIndexPage={true} />
      </div>

      <div
        data-uuid-domain="directory-index-scrollable"
        data-uuid={globalUUIDMapper.getFor(
          'directory-index-scrollable',
          crumbs.join('/')
        )}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        <h1>Index of {crumbs.length > 0 ? crumbs.join('/') : <>[/]</>}</h1>
        <table
          style={{
            tableLayout: 'fixed',
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              <td
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                <h2>Files</h2>
              </td>
              <td
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                <h2>Folders</h2>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  fontSize: '1.25em',
                }}
              >
                <ul>
                  {filenames.map((filename) => (
                    <li key={filename}>
                      <a href={getFilenameUrl(filename)}>{filename}</a>
                    </li>
                  ))}
                </ul>
              </td>
              <td
                style={{
                  fontSize: '1.25em',
                }}
              >
                <ul>
                  {dirnames.map((dirname) => (
                    <li key={dirname}>
                      <a href={getDirnameUrl(dirname)}>{dirname}</a>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return <Page overview={overview}>{content}</Page>;
}
