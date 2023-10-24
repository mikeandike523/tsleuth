import { PathHierarchyNode } from '@common/filesystem';

export type ContentIndex = {
  projectName: string;
  projectRoot: string;
  topLevelReadme: string | null;
  hierarchy: PathHierarchyNode<string>;
};
