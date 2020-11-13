import styled from 'styled-components';

export const Container = styled.div`
  width: 95%;
  max-width: 700px;
  position: absolute;
  opacity: 0.95;
  left: 50%;
  margin-top: 20px;
  transform: translateX(-50%);
  border: solid 2px #151515;
  background: #636363;
  padding: 16px;
  border-radius: 10px;

  hr {
    margin: 10px 0;
    opacity: 0.5;
  }

  button {
    background: #2c2c2c;
  }

  footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
  }
`;
