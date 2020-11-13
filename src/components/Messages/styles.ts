import styled from 'styled-components';

export const Container = styled.div`
  width: 92%;
`;

export const Title = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #2c2c2c;
  padding: 16px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;

  h3 {
    color: #b8b8b8;
    font-size: 16px;
    @media (min-width: 600px) {
      font-size: 18px;
    }
    @media (min-width: 800px) {
      font-size: 20px;
    }
  }
`;

export const Footer = styled.div`
  background: #2c2c2c;
  height: 40px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
`;
