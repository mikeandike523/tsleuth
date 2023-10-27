import { useState, useEffect } from 'react';

import { ASTIntermediate } from '@cli/lib/ast-traversal';
import { usePopulateContentIndex } from './usePopulateContentIndex';
import { accessPathHierarchyNodeData } from '@common/filesystem';
import { basenameIsSourceFile } from '@/lib/source-files';
import { ContentIndex } from '@/lib/content-index';
import { fetchJSONContent } from '@/lib/fetch-content';

/**
 * Load the appropriate AST intermediate file from the "content" directory.
 *
 * @param sourceFilePath - The path to the source file for which the intermediate was generated, NOT the path to the intermediate file itself
 *
 * @returns - The desired AST intermediate, or null if the content index has not been loaded yet
 */
export function useASTIntermediate(sourceFilePath: string[]) {
  const [content, setContent] = useState<ASTIntermediate | null>(null);
  if (sourceFilePath.length === 0) {
    throw new Error('No AST for root');
  }
  const bn = sourceFilePath[sourceFilePath.length - 1];
  if (!basenameIsSourceFile(bn)) {
    throw new Error('No AST for non-source file');
  }
  const contentIndex = usePopulateContentIndex();

  const fetchRoutine = async () => {
    const data = accessPathHierarchyNodeData(
      (contentIndex as ContentIndex).hierarchy,
      sourceFilePath
    );
    if (typeof data === 'undefined') {
      throw new Error(
        `Could not find AST intermediate for ${sourceFilePath.join('/')}`
      );
    }
    setContent(await fetchJSONContent<ASTIntermediate>(data));
  };

  useEffect(() => {
    if (contentIndex && !content) {
      fetchRoutine();
    }
  }, [contentIndex, content]);

  return content;
}
