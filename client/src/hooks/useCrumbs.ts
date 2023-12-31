import { useLocation } from 'react-router-dom';

import { basenameIsSourceFile } from '@/lib/source-files';

export function normalizeHashRoute(hash: string) {
  const processed = hash
    .trim()
    .replace('#', '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/g, '')
    .replace(/\/+$/g, '');
  if (processed === '' || processed === '/') {
    return '';
  }
  return processed;
}

export type RouteType = 'index' | 'file' | 'directory';

export type Crumbs = {
  routeType: RouteType;
  /**
   * The containing directory, represented as an array of strings in order to avoid formatting related issue
   */
  containingDirectory: string[];
  /**
   * The basename of the file or directory
   */
  basename: string;
  /**
   * The application has feature to have direct url to an entity within a file, i.e. a link to a symbol, or the full source code, etc.
   */
  entityPath?: string[];
};

/**
 * Neatly asseble the (HashRouter) url parameters
 * into a format relevant to this project
 *
 * To make things easy, ":" seperates between path and entities, and it must be given its own path segment
 *
 * e.g.
 * /my/path/to/file.ts/:/entity/route
 * /my/path/to/directory/:/entity/route
 */
export function useCrumbs(): Crumbs {
  const hashRoute = normalizeHashRoute(useLocation().pathname);
  if (hashRoute === '') {
    return {
      routeType: 'index',
      containingDirectory: [],
      basename: '',
    };
  }

  const rawCrumbs = hashRoute.split('/');

  const pathCrumbs = [];

  const entityCrumbs = [];

  let insideFile = false;
  for (let i = 0; i < rawCrumbs.length; i++) {
    if (!insideFile) {
      if (rawCrumbs[i] === ':') {
        insideFile = true;
      } else {
        pathCrumbs.push(rawCrumbs[i]);
      }
    } else {
      entityCrumbs.push(rawCrumbs[i]);
    }
  }

  const lastItem =
    pathCrumbs.length > 0 ? pathCrumbs[pathCrumbs.length - 1] : undefined;

  const routeType = basenameIsSourceFile(lastItem) ? 'file' : 'directory';

  if (pathCrumbs.length === 0) {
    throw new Error('Unexpected route length of 0');
  }

  if (pathCrumbs.length > 1) {
    const basename = pathCrumbs[pathCrumbs.length - 1];
    const containingDirectory = pathCrumbs.slice(0, -1);
    return {
      routeType,
      containingDirectory,
      basename,
      entityPath: entityCrumbs,
    };
  } else {
    const basename = pathCrumbs[0];
    const containingDirectory: string[] = [];
    return {
      routeType,
      containingDirectory,
      basename,
      entityPath: entityCrumbs,
    };
  }
}
