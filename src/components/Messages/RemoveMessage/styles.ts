import styled from 'styled-components';
import { Container as DadContainer } from '../NewMessage/styles';

export const Container = styled(DadContainer)`
  h6 {
    font-size: 16px;
    color: #ff0000;
  }
  p {
    text-align: left;
    font-size: 16px;
    @media (min-width: 400px) {
      font-size: 18px;
    }
    @media (min-width: 600px) {
      font-size: 22px;
    }
    strong {
      font-size: 110%;
      color: #fff;
    }
  }
`;
