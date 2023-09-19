import React from 'react';

import { SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';

export interface BoxProps extends React.HTMLProps<HTMLDivElement> {
  css?: SerializedStyles;
}

export function Box({ css, as, ...rest }: BoxProps) {
  const StyledDiv = styled.div(css);
  return <StyledDiv {...rest} />;
}
