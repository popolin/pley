import styled, { css } from 'styled-components';
import { shade } from 'polished';

interface MessageProps {
  dark: boolean;
}

export const Container = styled.div<MessageProps>`
  padding: 5px 10px;
  margin: 20, 0px;
  background: #f4f8fb;
  ${props =>
    props.dark &&
    css`
      background: #edeff4;
    `}

  div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    h3 {
      color: #8694a6;
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
        color: #c4ccd4;
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
        color: #bd1c2b;
        width: 30px;
        height: 30px;
        &:hover {
          color: ${shade(0.8, '#bd1c2b')};
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
    color: #a3abb6;
    font-size: 14px;
    @media (min-width: 600px) {
      font-size: 16px;
    }
    @media (min-width: 800px) {
      font-size: 18px;
    }
  }
`;
