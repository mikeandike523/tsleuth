import { Box } from '@chakra-ui/react';

import { Page } from '@/components/project/page';
import { useCrumbs } from '@/hooks/useCrumbs';
import { SubpageFile } from './subpage-file';
import { SubpageDirectory } from './subpage-directory';

export type SubpageType = 'file' | 'directory';

export default function SubpageRouter() {
  const crumbs = useCrumbs();
  console.log(crumbs);
  const routeType = crumbs.routeType;
  return (
    <Page>
      {routeType === 'file' ? (
        <SubpageFile />
      ) : routeType === 'directory' ? (
        <SubpageDirectory />
      ) : (
        <></>
      )}
    </Page>
  );
}
