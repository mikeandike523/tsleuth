import { useRef } from 'react';

import { Box } from '@chakra-ui/react';

import { Page } from '@/components/project/page';
import { useCrumbs } from '@/hooks/useCrumbs';
import { SubpageFile } from './subpage-file';
import { SubpageDirectory } from './subpage-directory';
import Home from '@/pages/index';

export type SubpageType = 'file' | 'directory';

export default function SubpageRouter() {
  const crumbs = useCrumbs();
  const routeType = crumbs.routeType;
  const pageBoxRef = useRef<HTMLDivElement | null>(null);
  return (
    <Page ref={pageBoxRef}>
      {routeType === 'file' ? (
        <SubpageFile
          scrollTopSetter={(scrollTop: number) => {
            if (pageBoxRef.current) {
              pageBoxRef.current.scrollTop = scrollTop;
            }
          }}
        />
      ) : routeType === 'directory' ? (
        <SubpageDirectory />
      ) : (
        <Home />
      )}
    </Page>
  );
}
