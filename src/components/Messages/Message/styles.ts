import styled, { css } from 'styled-components';
import { shade } from 'polished';

interface MessageProps {
  dark: boolean;
}

export const Container = styled.div<MessageProps>`
  padding: 5px 10px;
  margin: 20, 0px;
  background: #6e6e6e;
  ${props =>
    props.dark &&
    css`
      background: #636363;
    `}

  div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-family: 'Shadows Into Light', cursive;
      color: #151515;
      font-size: 14px;
      @media (min-width: 600px) {
        font-size: 16px;
      }
      @media (min-width: 800px) {
        font-size: 20px;
      }
    }

    div {
      h6 {
        font-family: 'Poppins', sans-serif;
        color: #b8b8b8;
        font-size: 12px;
        @media (min-width: 600px) {
          font-size: 14px;
        }
        @media (min-width: 800px) {
          font-size: 16px;
        }
      }

      button {
        margin: 0;
        border: 0;
        padding: 0;
        color: #cc005f;
        width: 30px;
        height: 30px;
        &:hover {
          color: ${shade(0.8, '#cc005f')};
        }

        svg {
          font-size: 14px;
          @media (min-width: 600px) {
            font-size: 16px;
          }
          @media (min-width: 800px) {
            font-size: 18px;
          }
        }
      }
    }
  }

  p {
    text-align: left;
    margin-top: 2px;
    color: #2c2c2c;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    @media (min-width: 600px) {
      font-size: 16px;
    }
    @media (min-width: 800px) {
      font-size: 18px;
    }
  }
`;
