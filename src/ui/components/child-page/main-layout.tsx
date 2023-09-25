import React, { ReactNode } from 'react';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Navbar } from '../common/navbar';
import { NodeInfo } from '<^w^>/lib/ast-parsing/types';
import { Overview } from '<^w^>/lib/site-generation/overview';
import { Page } from '../common/page';
import { UUIDContext } from '<^w^>/lib/utils/uuid-context';
import { getGlobalUUIDMapper } from '<^w^>/lib/utils/global-uuid-mapper';

export interface MainLayoutProps {
  crumbs: string[];
  symbols: NodeInfo[];
  outDir: string;
  overview: Overview;
}

export function MainLayout({
  crumbs,
  outDir,
  symbols,
  overview,
}: MainLayoutProps) {
  const globalUUIDMapper = getGlobalUUIDMapper();
  const content = (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 0,
        }}
      >
        <Navbar crumbs={crumbs} outDir={outDir} isIndexPage={false} />
      </div>
      <div
        data-uuid-domain="symbol-list-scrollable"
        data-uuid={globalUUIDMapper.getFor(
          'symbol-list-scrollable',
          crumbs.join('/')
        )}
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {symbols.map((symbol, idx) => {
          let displayName = symbol.name ?? '<no-name>';

          if (symbol.nameChain.length > 0) {
            displayName =
              symbol.nameChain.join('\u2192') + '\u2192' + displayName;
          }

          let shouldStartExpanded = false;
          if (symbol.kind) {
            if (!(symbol.signatureSourceCode ?? ''.trim() !== '')) {
              if (
                symbol.kind === 'Property' ||
                symbol.kind === 'Enum' ||
                symbol.kind === 'EnumMember' ||
                symbol.kind === 'Interface' ||
                symbol.kind === 'TypeAlias' ||
                symbol.kind === 'VariableDecl'
              ) {
                shouldStartExpanded = true;
              }
            }
          }

          return (
            <div
              id={symbol.uuid}
              key={idx}
              style={{
                width: '100%',
                background: 'skyblue',
                marginBottom: '1em',
              }}
            >
              <table
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                }}
              >
                <thead>
                  <tr>
                    <td colSpan={2}>
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '1em',
                        }}
                      >
                        <div
                          style={{
                            color: 'gray',
                          }}
                        >
                          ({symbol.tsKindShort})
                        </div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '1.5em',
                          }}
                        >
                          {displayName}
                        </div>
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Qualifiers:</td>
                    <td>
                      {symbol.exportQualifier ? (
                        <>
                          {'export: ' + symbol.exportQualifier}
                          <br />
                        </>
                      ) : (
                        <></>
                      )}
                      {symbol.storageQualifier ? (
                        <>
                          {'storageQualifier: ' + symbol.storageQualifier}
                          <br />
                        </>
                      ) : (
                        <></>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <pre
                        style={{
                          width: '100%',
                          whiteSpace: 'pre-wrap',
                          background: 'lightgray',
                          color: 'darkgreen',
                          fontWeight: 'bold',
                        }}
                      >
                        {symbol.documentation}
                      </pre>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      {symbol.signatureSourceCode && (
                        <div>
                          <div
                            style={{
                              textDecoration: 'underline',
                            }}
                          >
                            Function Signature
                          </div>
                          <div>
                            <pre
                              style={{
                                width: '100%',
                                whiteSpace: 'pre-wrap',
                                background: 'lightgray',
                                color: 'black',
                                fontWeight: 'bold',
                              }}
                            >
                              {symbol.signatureSourceCode}
                            </pre>
                          </div>
                        </div>
                      )}
                      <details open={shouldStartExpanded}>
                        <summary
                          style={{
                            textDecoration: 'underline',
                          }}
                        >
                          Full Source Code
                        </summary>
                        <pre
                          style={{
                            width: '100%',
                            whiteSpace: 'pre-wrap',
                            background: 'lightgray',
                            color: 'black',
                            fontWeight: 'bold',
                          }}
                        >
                          {symbol.sourceCode}
                        </pre>
                      </details>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );

  return <Page overview={overview}>{content}</Page>;
}
