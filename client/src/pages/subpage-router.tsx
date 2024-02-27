import { useRef } from 'react';

import { Page } from '@/components/project/page';
import { useCrumbs } from '@/hooks/useCrumbs';
import Home from '@/pages/index';
import { SubpageDirectory } from './subpage-directory';
import { SubpageFile } from './subpage-file';

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
