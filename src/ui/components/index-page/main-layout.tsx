import React, { ReactNode } from 'react';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Navbar } from '../common/navbar';

export interface MainLayoutProps {
  crumbs: string[];
  listing: {
    name: string;
    isLeaf: boolean;
  }[];
  outDir: string;
}

export function MainLayout({ crumbs, outDir, listing }: MainLayoutProps) {
  const filenames = listing.filter((l) => l.isLeaf).map((l) => l.name);
  const dirnames = listing.filter((l) => !l.isLeaf).map((l) => l.name);

  const getFilenameUrl = (filename: string) => {
    return ('/' + crumbs.join('/') + '/' + filename + '.html').replace(
      /\/+/g,
      '/'
    );
  };

  const getDirnameUrl = (dirname: string) => {
    return ('/' + crumbs.join('/') + '/' + dirname + '/index.html').replace(
      /\/+/g,
      '/'
    );
  };

  return (
    <div
      style={{
        width: '100%',
      }}
    >
      <Navbar crumbs={crumbs} outDir={outDir} isIndexPage={true} />
      <div>
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
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                }}
              >
                <h2>Files</h2>
              </td>
              <td
                style={{
                  textAlign: 'center',
                  fontSize: '1.5em',
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
}
