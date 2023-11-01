import Highlight from 'react-highlight';
import { Box } from '@chakra-ui/react';

import { heavyPlusSign, heavyMinusSign } from '../project/special-strings';

/**
 * A subset of the languages supported by "highlight.js" third party library
 */
export type SupportedLanguage = 'typescript' | 'javascript';

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
  title: string;
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
}

/**
 * A component that displays a code snippet in an expandable container
 * Supports previewing multiple lines, or adding an ellipsis for minimal preview footprint
 *
 * The caller/user of the comopnent is expected to import the desired "highlight.js" theme
 */
export function CodeSnippet({
  title,
  initialState,
  language,
  previewLines,
}: CodeSnippetProps) {
  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap="8px"
      ></Box>
    </Box>
  );
}
