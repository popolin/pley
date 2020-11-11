import React from 'react';

import RingLoader from 'react-spinners/RingLoader';

import { Container } from './styles';

interface LoadindProps {
  message?: string;
}

const Loading: React.FC<LoadindProps> = ({ message = 'Loading...' }) => (
  <Container>
    <RingLoader color="#585858" size={120} loading />
    <h2>{message}</h2>
  </Container>
);

export default Loading;
