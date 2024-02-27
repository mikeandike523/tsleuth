import EnsureReactInScope from '@/EnsureReactInScope';
EnsureReactInScope();

import { ReactElement, useEffect, useRef, useState } from 'react';

import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { CodeSnippet } from '@/components/framework/code-snippet';
import { CrumbSequence } from '@/components/project/crumb-sequence';
import { rightFacingArrow } from '@/components/project/special-strings';
import { useLookAtMeAnimationCss } from '@/css/look-at-me';
import { useASTIntermediate } from '@/hooks/useASTIntermediate';
import { useCrumbs } from '@/hooks/useCrumbs';
import { usePopulateContentIndex } from '@/hooks/usePopulateContentIndex';
import { basenameIsSourceFile } from '@/lib/source-files';
import { SerializableASTNode } from '@cli/lib/ast-traversal';
import { accessPathHierarchyNodeData } from '@common/filesystem';
import { docCommentToParagraph } from '@common/text';

export function SymbolSummary({
  node,
  prior,
}: {
  node: SerializableASTNode;
  prior: SerializableASTNode[];
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
      }, 1000);
    }
  }, [isDirectLinked, boxRef.current]);

  const [isFlashing, setIsFlashing] = useState(false);

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
      gap="1em"
    >
      <Box display="flex" flexDirection="row" alignItems="center">
        {node.storageQualifier === 'const' && (
          <Text color="blue" fontWeight="bold">
            const
          </Text>
        )}
        {node.storageQualifier === 'let' && (
          <Text color="blue" fontWeight="bold">
            let
          </Text>
        )}
        {node.storageQualifier === 'var' && (
          <Text color="blue" fontWeight="bold">
            var
          </Text>
        )}
        {node.storageQualifier === 'global' && (
          <Text color="grey" fontWeight="bold" fontStyle="italic">
            (global)
          </Text>
        )}
        {node.exported && (
          <Text fontWeight="bold" color="magenta">
            export
          </Text>
        )}
        {node.classElementModifiers &&
          node.classElementModifiers.length > 0 &&
          node.classElementModifiers.map((modifier, i) => {
            return (
              <Text key={i} fontWeight="bold" color="blue">
                {modifier.text}
              </Text>
            );
          })}
        <Text
          onClick={(e) => {
            if (e.ctrlKey) {
              navigator.clipboard
                .writeText(JSON.stringify(node, null, 2))
                .then(() => {
                  alert('Full node info c opied to clipboard');
                })
                .catch((e) => {
                  alert(
                    'Could not copy to clipboard. Check the console for more details.'
                  );
                  console.log(e);
                });
            }
          }}
          fontWeight="bold"
          fontSize="lg"
        >
          {name}
        </Text>
        <Text fontSize="lg" fontStyle="italic" color="green">
          {node.kindName}
        </Text>
        {node.narrowKindName && (
          <>
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

export function SubpageFile({}: SubpageFileProps) {
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
          }, 1000);
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
