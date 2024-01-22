import { useState, useEffect } from 'react';

import { ASTIntermediate } from '@cli/lib/ast-traversal';
import { usePopulateContentIndex } from './usePopulateContentIndex';
import { accessPathHierarchyNodeData } from '@common/filesystem';
import { basenameIsSourceFile } from '@/lib/source-files';
import { ContentIndex } from '@/lib/content-index';
import { fetchJSONContent } from '@/lib/fetch-content';
import { useCrumbs } from './useCrumbs';

export async function retrieveASTIntermediateFromContentIndex(
  contentIndex: ContentIndex | null,
  sourceFilePath: string[]
) {
  if (contentIndex === null) {
    return null;
  }
  const data = accessPathHierarchyNodeData(
    (contentIndex as ContentIndex).hierarchy,
    sourceFilePath
  );
  if (typeof data === 'undefined') {
    throw new Error(
      `Could not find AST intermediate for ${sourceFilePath.join('/')}`
    );
  }
  return await fetchJSONContent<ASTIntermediate>(data);
}

/**
 * Load the appropriate AST intermediate file from the "content" directory.
 *
 * @param sourceFilePath - The path to the source file for which the intermediate was generated, NOT the path to the intermediate file itself
 *
 * @returns - The desired AST intermediate, or null if the content index has not been loaded yet
 */
export function useASTIntermediate(
  sourceFilePath: string[],
  isNavbar: boolean = false
) {
  const crumbs = useCrumbs();

  const routeTypeOk = () => {
    return !isNavbar || crumbs.routeType === 'file';
  };

  const [content, setContent] = useState<ASTIntermediate | null>(null);

  const contentIndex = usePopulateContentIndex();

  const fetchRoutine = async () => {
    if (!routeTypeOk()) {
      return;
    }

    setContent(
      await retrieveASTIntermediateFromContentIndex(
        contentIndex,
        sourceFilePath
      )
    );
  };

  useEffect(() => {
    if (routeTypeOk() && contentIndex) {
      fetchRoutine();
    }
  }, [contentIndex, JSON.stringify(crumbs)]);

  if (!routeTypeOk()) {
    return null;
  }

  if (sourceFilePath.length === 0) {
    return null;
  }

  const bn = sourceFilePath[sourceFilePath.length - 1];

  if (!basenameIsSourceFile(bn)) {
    return null;
  }

  return content;
}
