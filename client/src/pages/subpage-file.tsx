import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactElement, useState, useEffect, useRef } from 'react';

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
import { docCommentToParagraph } from '@common/text';
import { useLookAtMeAnimationCss } from '@/css/look-at-me';
import { basenameIsSourceFile } from '@/lib/source-files';

export function SymbolSummary({
  node,
  prior,
  scrollTopSetter,
}: {
  node: SerializableASTNode;
  prior: SerializableASTNode[];
  scrollTopSetter: (scrollTop: number) => void;
}) {
  const crumbs = useCrumbs();

  const animationCss = useLookAtMeAnimationCss(500, 'yellow');

  const chain = prior.concat([node]);

  const boxRef = useRef<HTMLDivElement | null>(null);

  const isDirectLinked =
    JSON.stringify(crumbs.entityPath ?? []) ===
    JSON.stringify(
      chain.map((lnk) => {
        return lnk.id;
      })
    );

  useEffect(() => {
    if (isDirectLinked && boxRef.current) {
      boxRef.current.scrollIntoView({ behavior: 'auto' });
      setIsFlashing(true);
      const tm = setTimeout(() => {
        setIsFlashing(false);
        clearTimeout(tm);
      }, 1500);
    }
  }, [isDirectLinked, boxRef.current]);

  const [isFlashing, setIsFlashing] = useState(false);

  // TODO: Make it more robust by using the CrumbSequence component and navigating properly
  const name = '::' + chain.map((n) => n.name).join('::');
  let docElement: ReactElement | null = null;
  if (node.documentation) {
    try {
      docElement = (
        <Box
          background="lightgrey"
          color="green"
          whiteSpace="pre-wrap"
          fontFamily="monospace"
        >
          {docCommentToParagraph(node.documentation)}
        </Box>
      );
    } catch (e) {
      console.log(e);
      docElement = (
        <Box
          background="lightgrey"
          color="green"
          whiteSpace="pre-wrap"
          fontFamily="monospace"
        >
          {node.documentation}
        </Box>
      );
    }
  }

  return (
    <Box
      border="2px solid black"
      marginBottom="8px"
      width="100%"
      css={isFlashing && animationCss}
      ref={boxRef}
    >
      <Box display="flex" flexDirection="row" alignItems="center">
        <Text fontWeight="bold" fontSize="lg">
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
      {docElement !== null && (
        <>
          <Text>Documentation:</Text>
          {docElement}
        </>
      )}
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

      {node.signatureCode && (
        <>
          <Text>Signature:</Text>
          <CodeSnippet
            language="typescript"
            previewLines={3}
            initialState="expanded"
            code={node.signatureCode}
          />
        </>
      )}
      <Text>Source Code:</Text>
      <CodeSnippet
        language="typescript"
        previewLines={6}
        initialState="collapsed"
        code={node.sourceCode}
      />
    </Box>
  );
}

export interface SubpageFileProps {
  scrollTopSetter: (scrollTop: number) => void;
}

export function SubpageFile({ scrollTopSetter }: SubpageFileProps) {
  const navigate = useNavigate();
  const crumbs = useCrumbs();
  const contentIndex = usePopulateContentIndex();
  const symbolSummaries: ReactElement[] = [];
  const fullSourceCodeRef = useRef<HTMLDivElement | null>(null);
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

  const rootId = intermediate?.root?.id ?? null;
  const flashingCss = useLookAtMeAnimationCss(500, 'yellow');
  const [isFlashing, setIsFlashing] = useState(false);
  useEffect(() => {
    if ((crumbs.entityPath ?? []).length > 0) {
      const entity0 = (crumbs.entityPath ?? [])[0];
      if (
        rootId !== null &&
        (entity0 === rootId || entity0 === 'full_source_code')
      ) {
        if (fullSourceCodeRef.current) {
          fullSourceCodeRef.current.scrollIntoView({ behavior: 'auto' });
          setIsFlashing(true);
          const tm = setTimeout(() => {
            setIsFlashing(false);
            clearTimeout(tm);
          }, 1500);
        }
      }
    }
  }, [
    fullSourceCodeRef.current,
    rootId,
    intermediate !== null,
    JSON.stringify(crumbs.containingDirectory.concat([crumbs.basename])),
    JSON.stringify(crumbs.entityPath ?? []),
  ]);

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
    addSummary(
      <SymbolSummary
        scrollTopSetter={scrollTopSetter}
        node={node}
        prior={prior}
      />
    );
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
            let extra = '';
            if (
              path.length > 0 &&
              basenameIsSourceFile(path[path.length - 1])
            ) {
              extra = '/:/full_source_code';
            }
            navigate(path.join('/') + extra);
          }}
          sep={rightFacingArrow}
          path={crumbs.containingDirectory.concat([crumbs.basename])}
        />
      </Box>
      {symbolSummaries}
      <Box width="100%" ref={fullSourceCodeRef} css={isFlashing && flashingCss}>
        <Text textDecoration="underline" fontSize="lg">
          Full Source Code
        </Text>
        <CodeSnippet
          codeId={JSON.stringify(
            crumbs.containingDirectory
              .concat([crumbs.basename])
              .concat(['full_source_code'])
          )}
          previewLines={16}
          initialState="collapsed"
          language="typescript"
          code={intermediate.fullSourceCode}
        />
      </Box>
    </>
  );
}
