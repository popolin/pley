import styled, { css } from 'styled-components';

import { shade } from 'polished';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLInputElement> {
  theme: 'dark' | 'light' | 'success' | 'error';
}

export const Container = styled.div`
  position: absolute;
  padding: 30px;
  overflow: hidden;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  top: 20%;
  background: #0a0a0a;
  border: solid #010101;
  border-radius: 10px;
  opacity: 0.96;

  h4 {
    text-align: left;
  }

  h1 {
    margin-bottom: 30px;
  }

  footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 16px;

    div {
      button {
        margin-left: 20px;
        width: 120px;
      }
    }
  }

  ul {
    list-style: none;
    margin-top: 20px;
  }
`;

export const Button = styled.button<ButtonProps>`
  margin-top: 16px;
  padding: 8px 18px;
  background: #fff;
  border-radius: 5px;
  font-weight: 600;

  ${props =>
    props.theme === 'dark' &&
    css`
      background: #5c5c5c;
      color: #fff;
    `}

  ${props =>
    (!props.theme || props.theme === 'light') &&
    css`
      background: #fff;
      color: #5c5c5c;
    `}

  ${props =>
    props.theme === 'success' &&
    css`
      background: #90ed8d;
      color: #1c491b;
    `}

  ${props =>
    props.theme === 'error' &&
    css`
      background: #f18686;
      color: #721711;
    `}
`;

export const Guess = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
  img {
    height: 250px;
  }
`;

export const Question = styled.div`
  background: #daedf7;
  color: #282828;
  border-radius: 5px;

  h3 {
    padding: 6px;

    strong {
      font-weight: 700;
      font-size: 110%;
    }
  }
`;

export const Answer = styled.li`
  margin-top: 4px;
  background: #1f1f1f;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background: ${shade(0.2, '#1f1f1f')};
    color: ${shade(0.2, '#fff')};
  }

  h3 {
    text-align: center;
    font-size: 16px;
    padding: 6px;
  }
`;
