import { useEffect, useState } from 'react';

import { Box, Text } from '@chakra-ui/react';
import Highlight from 'react-highlight';

import { lowerShadowCss } from '@/css/lower-shadow';
import { heavyMinusSign, heavyPlusSign } from '../project/special-strings';

export const supportedLanguageClassnames = {
  typescript: 'typescript ts tsx',
  javascript: 'javascript jsx js mjs cjs',
} as const;

/**
 * A subset of the languages supported by "highlight.js" third party library
 */
export type SupportedLanguage = keyof typeof supportedLanguageClassnames;

/**
 * The possible states of the `CodeSnippet` component.
 */
export type CodeSnippetState = 'expanded' | 'collapsed';

/**
 * The props passed to the `CodeSnippet` component.
 */
export interface CodeSnippetProps {
  /**
   * Optionally, a title for the code snippet
   */
  title?: string;
  /**
   * Whether to start expanded or collapsed, i.e. the initial value used in the React `useState` call
   */
  initialState: CodeSnippetState;
  /**
   * The language used to highlight the code snippet
   */
  language: SupportedLanguage;
  /**
   * The number of lines to show in the collapsed state
   * If 0, then an ellipsis is used
   * Generally, its bad UX to just have it be completely blank
   *
   * If ellipsis is used, then now shadow is present in the collapsed state
   */
  previewLines: number;
  /**
   * The source code to display
   */
  code: string;

  codeId?: string;
}

/**
 * A component that displays a code snippet in an expandable container
 * Supports previewing multiple lines, or adding an ellipsis for minimal preview footprint
 *
 * The caller/user of the comopnent is expected to import the desired "highlight.js" theme
 */
export function CodeSnippet({
  initialState,
  language,
  previewLines,
  code,
  codeId,
}: CodeSnippetProps) {
  const trueCodeId = codeId ?? code;
  const [expandState, setExpandState] = useState(initialState);
  const [codeIdState, setCodeIdState] = useState(trueCodeId);

  useEffect(() => {
    if (codeIdState !== trueCodeId) {
      setCodeIdState(trueCodeId);
      setExpandState(initialState);
    }
  }, [trueCodeId]);

  const normalizedCode = code.replace(/\r\n/g, '\n');

  const getCollapsedCode = () => {
    if (previewLines === 0) {
      return '...';
    }
    if (!normalizedCode.includes('\n')) {
      return normalizedCode;
    }
    const lines = normalizedCode.split('\n');
    const numLines = Math.min(previewLines, lines.length);
    return lines.slice(0, numLines).join('\n');
  };

  const numLines = (
    expandState === 'collapsed' ? getCollapsedCode() : normalizedCode
  ).split('\n').length;

  const fitsPreview = normalizedCode.split('\n').length <= previewLines;

  return (
    <Box width="100%" padding="8px" position="relative">
      <Box
        width="100%"
        border="2px solid blue"
        borderRadius="8px"
        position="relative"
      >
        <Box width="100%" position="relative" height={1.5 * numLines + 'em'}>
          <Box position="absolute" width="100%" background="#272822">
            <Highlight className={supportedLanguageClassnames[language]}>
              {expandState === 'expanded' ? normalizedCode : getCollapsedCode()}
            </Highlight>
          </Box>
          <Box
            position="absolute"
            width="100%"
            css={
              expandState === 'collapsed'
                ? !fitsPreview && lowerShadowCss
                : undefined
            }
          >
            <Box width="100%" visibility="hidden">
              <Highlight className={supportedLanguageClassnames[language]}>
                {expandState === 'expanded'
                  ? normalizedCode
                  : getCollapsedCode()}
              </Highlight>
            </Box>
            {!fitsPreview && (
              <Box
                position="absolute"
                bottom={0}
                width="100%"
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="flex-end"
              >
                <Box
                  fontSize="sm"
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="flex-start"
                  padding="8px"
                  gap="8px"
                  border="2px solid blue"
                  background="white"
                  cursor="pointer"
                  userSelect="none"
                  borderRadius="8px"
                  onClick={() => {
                    setExpandState(
                      expandState === 'expanded' ? 'collapsed' : 'expanded'
                    );
                  }}
                >
                  <Text fontSize="sm">
                    {expandState === 'expanded'
                      ? heavyMinusSign
                      : heavyPlusSign}
                  </Text>
                  <Text fontSize="sm">
                    {expandState === 'expanded' ? 'Collapse' : 'Expand'}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
