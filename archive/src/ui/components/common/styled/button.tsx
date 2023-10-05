import React from 'react';

import { SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';

export interface ButtonProps extends React.HTMLProps<HTMLDivElement> {
  css?: SerializedStyles;
}

export function Button({ css, as, ...rest }: ButtonProps) {
  const StyledButton = styled.div(css);
  return <StyledButton {...rest} />;
}
