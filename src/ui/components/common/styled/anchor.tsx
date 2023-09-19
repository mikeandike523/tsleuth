import React from 'react';

import { SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';

export interface AnchorProps extends React.HTMLProps<HTMLAnchorElement> {
  css?: SerializedStyles;
}

export function Anchor({ css, as, ...rest }: AnchorProps) {
  const StyledA = styled.a(css);
  return <StyledA {...rest} />;
}
