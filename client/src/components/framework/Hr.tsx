import { Box } from '@chakra-ui/react';

export interface HrProps {
  height?: number;
  background?: string;
}

export function Hr({ height, background }: HrProps) {
  return (
    <Box
      width="100%"
      height={height ?? 2 + 'px'}
      background={background ?? 'black'}
    />
  );
}
