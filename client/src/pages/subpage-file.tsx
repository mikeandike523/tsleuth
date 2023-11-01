import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactElement } from 'react';

import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useCrumbs } from '@/hooks/useCrumbs';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { accessPathHierarchyNodeData } from '@common/filesystem';
import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { CrumbSequence } from '@/components/project/crumb-sequence';
import { rightFacingArrow } from '@/components/project/special-strings';
import { Hr } from '@/components/framework/Hr';
import { CodeSnippet } from '@/components/framework/code-snippet';
import { SerializableASTNode } from '@cli/lib/ast-traversal';

/* For reference
export type ASTNode = {
  kind: ts.SyntaxKind;
  kindName: string;
  narrowKind: ts.SyntaxKind | null;
  narrowKindName: string | null;
  startChar: number;
  endChar: number;
  startLCP: LineColumnPair;
  endLCP: LineColumnPair;
  sourceCode: string; // Does not include doc comment
  documentation: string | null;
  name: string | null;
  storageQualifier: StorageQualifier | null;
  classElementModifiers: Modifier[] | null;
  signatureCode: string | null;
  exported: ExportMode | null;
  id: string;
  tsNode?: ts.Node;
  children: ASTNode[];
  parent: ASTNode | null;
};

export type SerializableASTNode = Omit<
  ASTNode,
  'parent' | 'tsNode' | 'children'
> & {
  children: SerializableASTNode[];
};
*/

export function SymbolSummary({
  node,
  prior,
}: {
  node: SerializableASTNode;
  prior: SerializableASTNode[];
}) {
  const chain = prior.concat([node]);
  // TODO: Make it more robust by using the CrumbSequence component and navigating properly
  const name = '::' + chain.map((n) => n.name).join('::');
  return (
    <Box border="2px solid black" marginBottom="8px" width="100%">
      <Box display="flex" flexDirection="row" alignItems="center">
        <Text textDecoration="underline" fontSize="lg">
          {name}
        </Text>
        <Text fontSize="lg">&nbsp;</Text>
        <Text fontSize="lg" fontStyle="italic" color="green">
          {node.kindName}
        </Text>
        {node.narrowKindName && (
          <>
            <Text fontSize="lg">&nbsp;</Text>
            <Text fontSize="lg" fontStyle="italic" color="green">
              {node.narrowKindName}
            </Text>
          </>
        )}
      </Box>

      {(node.storageQualifier ||
        (node.classElementModifiers?.length ?? 0 > 0) ||
        node.exported) && (
        <>
          <Text>Qualifiers:</Text>
          <table
            style={{
              borderCollapse: 'collapse',
              border: '1px solid black',
              tableLayout: 'auto',
            }}
          >
            {/* No need for thead in this table */}
            <tbody>
              <tr>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '4px',
                  }}
                >
                  Export Type
                </td>
                <td>{node.exported ?? 'Not Exported'}</td>
              </tr>
              {node.storageQualifier && (
                <tr>
                  <td
                    style={{
                      border: '1px solid black',
                      padding: '0.125em',
                    }}
                  >
                    Storage Qualifier
                  </td>
                  <td
                    style={{
                      border: '1px solid black',
                      padding: '0.125em',
                    }}
                  >
                    {node.storageQualifier}
                  </td>
                </tr>
              )}
              {node.classElementModifiers?.length && (
                <tr
                  style={{
                    border: '1px solid black',
                    padding: '0.125em',
                  }}
                >
                  <td
                    style={{
                      border: '1px solid black',
                      padding: '0.125em',
                    }}
                  >
                    Class Element Modifiers
                  </td>
                  <td
                    style={{
                      border: '1px solid black',
                      padding: '0.125em',
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="flex-start"
                      gap="1em"
                      paddingTop="4px"
                      paddingBottom="4px"
                    >
                      {node.classElementModifiers?.map((m, i) => (
                        <Box
                          key={i}
                          border="1px dashed black"
                          padding="0.125em"
                          whiteSpace="pre-wrap"
                        >
                          {JSON.stringify(m, null, 2)}
                        </Box>
                      ))}
                    </Box>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
      {/* For now, the documentation is in the doc comment syntax, but if in the future we parse and dedent it we need to handle it differently */}
      {node.documentation && (
        <>
          <Text>Documentation:</Text>
          <CodeSnippet
            language="typescript"
            previewLines={0}
            initialState="expanded"
            code={node.documentation}
          />
        </>
      )}
      {node.signatureCode && (
        <>
          <Text>Signature:</Text>
          <CodeSnippet
            language="typescript"
            previewLines={0}
            initialState="expanded"
            code={node.signatureCode}
          />
        </>
      )}
      <Text>Source Code:</Text>
      <CodeSnippet
        language="typescript"
        previewLines={0}
        initialState="expanded"
        code={node.sourceCode}
      />
    </Box>
  );
}

export interface SubpageFileProps {}

export function SubpageFile({}: SubpageFileProps) {
  const navigate = useNavigate();
  const crumbs = useCrumbs();
  const contentIndex = usePopulateContentIndex();
  const symbolSummaries: ReactElement[] = [];
  const addSummary = (symbolSummary: ReactElement) => {
    const key = 'symbol-summary-' + symbolSummaries.length;
    symbolSummaries.push(
      <Box width="100%" key={key}>
        {symbolSummary}
      </Box>
    );
  };
  const intermediate = useASTIntermediate(
    crumbs.containingDirectory.concat([crumbs.basename]),
    false
  );

  if (!contentIndex) {
    return <>Loading...</>;
  }

  if (crumbs.routeType === 'index' || crumbs.basename === '') {
    return <></>;
  }

  const intermediateFile = accessPathHierarchyNodeData(
    contentIndex.hierarchy,
    crumbs.containingDirectory.concat([crumbs.basename])
  );

  if (!intermediateFile) {
    throw new Error('Corrupted content index');
  }

  if (!intermediate) {
    return <>Loading...</>;
  }

  const root = intermediate.root;

  if (root === null) {
    throw new Error('Root ast node was null');
  }

  const recursion = (
    node: SerializableASTNode,
    prior: SerializableASTNode[]
  ) => {
    addSummary(<SymbolSummary node={node} prior={prior} />);
    for (const child of node.children) {
      recursion(child, prior.concat([node]));
    }
  };

  for (const child of root.children) {
    recursion(child, []);
  }

  return (
    <>
      <Box
        width="100%"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        gap="0.5em"
        borderBottom="1px solid black"
      >
        <Text fontSize="xl">Symbols Of:</Text>
        <CrumbSequence
          onNavigate={(path: string[]) => {
            navigate(path.join('/'));
          }}
          sep={rightFacingArrow}
          path={crumbs.containingDirectory.concat([crumbs.basename])}
        />
      </Box>
      {symbolSummaries}
      <Text textDecoration="underline" fontSize="lg">
        Full Source Code
      </Text>
      <CodeSnippet
        previewLines={16}
        initialState="collapsed"
        language="typescript"
        code={intermediate.fullSourceCode}
      />
    </>
  );
}
