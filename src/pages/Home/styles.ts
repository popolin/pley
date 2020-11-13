import styled from 'styled-components';

import introBgImg from '../../assets/intro-bg.jpg';

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const Header = styled.div`
  background: url(${introBgImg}) no-repeat center;
  background-attachment: fixed;
  background-size: cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-top: 150px;

  h1 {
    @media (min-width: 600px) {
      font-size: 40px;
    }
    @media (min-width: 701px) {
      font-size: 50px;
    }
    @media (min-width: 901px) {
      font-size: 70px;
    }
  }

  h2 {
    font-size: 16px;
    @media (min-width: 400px) {
      font-size: 20px;
    }
    @media (min-width: 600px) {
      font-size: 24px;
    }
    @media (min-width: 701px) {
      font-size: 30px;
    }
    @media (min-width: 901px) {
      font-size: 35px;
    }
    margin-top: 10px;
  }

  span {
    font-size: 10px;
    @media (min-width: 400px) {
      font-size: 12px;
    }
    @media (min-width: 600px) {
      font-size: 16px;
    }
    @media (min-width: 701px) {
      font-size: 18px;
    }
    @media (min-width: 901px) {
      font-size: 24px;
    }
    margin: 0 10px;

    &::before,
    &:last-of-type::after {
      content: '';
      text-align: center;
      display: inline-block;
      padding: 0;
      @media (min-width: 400px) {
        content: '|';
        padding: 0 15px 0 10px;
      }
      @media (min-width: 600px) {
        content: '|';
        padding: 0 30px 0 20px;
      }
      color: #5c5c5c;
    }
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #ffffff;
    border: solid 3px #5c5c5c;
    line-height: 55px;
    padding: 0 30px;
    margin-top: 40px;
    font-size: 16px;
    font-weight: 600;
    transition: border-color 0.4s;

    &:hover {
      border-color: #cc005f;
    }

    svg {
      margin-left: 15px;
    }
  }

  ul {
    margin-top: 160px;
    margin-bottom: 40px;
    list-style: none;
    display: inline-flex;

    a {
      text-decoration: none;
      margin: 0 20px;
      color: #ffffff;
      transition: color 0.4s;

      &:hover {
        color: #cc005f;
      }

      svg {
        font-size: 30px;
      }
    }
  }

  p {
    margin-top: 20px;
    color: #bfbfbf;
  }
`;

export const Footer = styled(Header)`
  display: flex;
  background: #151515;
  background-size: cover;

  > p {
    text-align: left;
    width: 100%;
    margin-bottom: 20px;
    margin-left: 20px;
    color: #6e6e6e;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;

    a {
      text-decoration: none;
      color: #fff;
    }
  }
`;

export const Topo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 13px;

  img {
    width: auto;
    height: 80px;
    @media (min-width: 600px) {
      height: 90px;
    }
    @media (min-width: 701px) {
      height: 110px;
    }
    @media (min-width: 901px) {
      height: 120px;
    }
    border-radius: 50%;
  }

  div {
    margin-left: 20px;
  }
`;

export const Jobs = styled.div`
  flex-direction: column;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: 560px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 801px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
  margin: 50px 0;
`;

export const Item = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  max-width: 300px;
  margin: 5px 30px;

  svg {
    font-size: 40px;
    @media (min-width: 600px) {
      font-size: 45px;
    }
    @media (min-width: 701px) {
      font-size: 50px;
    }
    @media (min-width: 901px) {
      font-size: 60px;
    }
    color: #cc005f;
  }

  h3 {
    margin-top: 15px;
    color: #fff;
    text-transform: none;
  }

  p {
    margin-top: 20px;
    color: #bfbfbf;
    font-size: 16px;
    @media (min-width: 701px) {
      font-size: 22px;
    }

    a {
      text-decoration: none;
      color: #fff;
      font-weight: 500;
    }
  }
`;

export const Contacts = styled(Jobs)`
  grid-template-columns: 1fr 1fr 1fr;
  /* @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr 1fr;
  } */
`;

export const ItemContact = styled.a`
  display: flex;
  align-items: center;
  flex-direction: column;
  max-width: 300px;
  margin: 0px 5px;
  text-decoration: none;

  svg {
    font-size: 30px;
    @media (min-width: 701px) {
      font-size: 35px;
    }
    @media (min-width: 901px) {
      font-size: 40px;
    }
    color: #fff;
  }

  h3 {
    margin-top: 15px;
    font-size: 12px;
    @media (min-width: 600px) {
      font-size: 16px;
    }
    @media (min-width: 701px) {
      font-size: 18px;
    }
    @media (min-width: 901px) {
      font-size: 22px;
    }
    color: #cc005f;
    text-transform: none;
  }

  p {
    margin-top: 20px;
    color: #6e6e6e;
    font-family: 'Poppins', sans-serif;
    font-size: 10px;
    @media (min-width: 600px) {
      font-size: 12px;
    }
    @media (min-width: 701px) {
      font-size: 14px;
    }
    @media (min-width: 901px) {
      font-size: 16px;
    }
    font-weight: 400;
    line-height: 1.6;

    a {
      text-decoration: none;
      color: #6e6e6e;
    }
  }
`;
