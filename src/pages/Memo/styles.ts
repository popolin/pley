import styled, { css } from 'styled-components';

interface CardOuterProps {
  flipped?: boolean;
}

interface CardProps {
  flipped?: boolean;
}

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 20px;
  background: #151515;
`;

export const Board = styled.div`
  width: calc(100vh - 240px);
  max-width: calc(100vw - 40px);
  display: grid;
  grid-gap: 10px;
  margin: auto;
  grid-template-columns: repeat(6, 1fr);
`;

export const Card = styled.div<CardProps>`
  border-radius: 5px;
  position: relative;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
  transform-style: preserve-3d;
  transition: all 0.3s;

  ${props =>
    props.flipped &&
    css`
      transform: rotateY(0);
    `}

  .front,
  .back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
  }

  .front img {
    display: block;
    max-width: 100%;
  }
  .back {
    background-color: #468;
    transform: rotateY(180deg);
  }
`;

export const CardOuter = styled.div<CardOuterProps>`
  perspective: 1000px;
  height: calc((100vh - 290px) / 6);
  max-height: calc((100vw - 90px) / 6);

  ${props =>
    props.flipped &&
    css`
      transform: rotateY(0);
    `}
`;

export const Stats = styled.div`
  width: 400px;
  margin: 0 auto;
  text-align: center;
  color: #fff;
  padding: 20px 0;
  font-size: 2rem;
`;

export const SelectGroup = styled.div`
  width: 400px;
  margin: 0 auto;
  text-align: center;
  color: #fff;
  padding: 20px 0;
  font-size: 2rem;
`;

export const Groups = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
`;
