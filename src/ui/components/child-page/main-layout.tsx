import React, { ReactNode } from 'react';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Navbar } from '../common/navbar';
import { NodeInfo } from '<^w^>/lib/ast-parsing/types';

export interface MainLayoutProps {
  crumbs: string[];
  symbols: NodeInfo[];
  outDir: string;
}

export function MainLayout({ crumbs, outDir, symbols }: MainLayoutProps) {
  return (
    <div
      style={{
        width: '100%',
      }}
    >
      <Navbar crumbs={crumbs} outDir={outDir} />

      <hr />

      {symbols.map((symbol, idx) => {
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
                        ({symbol.kind})
                      </div>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '1.5em',
                        }}
                      >
                        {symbol.name}
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <tr>
                    <td colSpan={2}>
                      <a href={symbol.link}>{symbol.link}</a>
                    </td>
                  </tr>
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
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
