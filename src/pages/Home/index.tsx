import React, { useState } from 'react';
import {
  FaFacebookF,
  FaInstagram,
  FaEnvelope,
  FaGamepad,
  FaTheaterMasks,
  FaCommentsDollar,
  FaChalkboardTeacher,
  FaMapPin,
  FaRegEnvelope,
  FaPhoneAlt,
} from 'react-icons/fa';

import {
  Container,
  Header,
  Footer,
  Jobs,
  Item,
  Contacts,
  ItemContact,
  Topo,
} from './styles';

import Jogo from '../../components/Jogo';

import imgProfile from '../../assets/profile.jpg';

const Home: React.FC = () => {
  const [game, showGame] = useState(false);

  return (
    <>
      {game && <Jogo onClose={() => showGame(false)} />}
      <Container>
        <Header>
          <h5>Born to be alive.</h5>
          <h1>Marcílio Mendes Pley.</h1>
          <div>
            <span>Vendas</span>
            <span>Treinamento</span>
            <span>Humor</span>
          </div>
          <button type="button" onClick={() => showGame(true)}>
            Jogo dos personagens
            <FaGamepad />
          </button>
          <ul>
            <li>
              <a href="https://www.facebook.com/marciliomendes.pley">
                <FaFacebookF />
              </a>
            </li>
            <li>
              <a href="http://instagram.com/humortivacione/">
                <FaInstagram />
              </a>
            </li>
            <li>
              <a href="mailto: farmazil.vendas@gmail.com">
                <FaEnvelope />
              </a>
            </li>
          </ul>
        </Header>

        <Footer>
          <Topo>
            <img src={imgProfile} alt="Marcilio Pley" />
            <div>
              <h5>All Right! Country Sunday.</h5>
              <h2>O que posso fazer por você?</h2>
            </div>
          </Topo>
          <h4>
            Fazer algo pelos outros é uma poderosa ferramenta para reforçar
            nossa saúde e felicidade.
          </h4>
          <Jobs>
            <Item>
              <FaCommentsDollar />
              <h3>Vendas</h3>
              <p>
                Sou especialista em vendas de produtos farmacêuticos e pioneiro
                no ramo de produtos naturais em Brasilia. Atualmente trabalho
                com produtos do laboratório{' '}
                <a href="https://www.laboratoriosobral.com.br">Sobral</a>, onde
                também ministro treinamento de vendas.
              </p>
            </Item>
            <Item>
              <FaChalkboardTeacher />
              <h3>Treinamento</h3>
              <p>
                Desenvolvi uma metodologia de treinamento para vendedores e
                atendentes de callcenter da indústria farmacêutica. Somando
                minha experiência ao humor, é possível motivar os profissionais
                a buscarem seu melhor. Fale comigo e conheça mais.
              </p>
            </Item>
            <Item>
              <FaTheaterMasks />
              <h3>Teatro</h3>
              <p>
                Hobby desenvolvido a partir de origens familiares e desejo de
                fazer as pessoas sorrirem. Participei de treinamentos para
                compreensão de tempo de fala, oratória, posicionamento em palco
                e técnicas de Rapport na escola{' '}
                <a href="https://www.instagram.com/espacoteatraldf/">
                  Espaço Teatral
                </a>{' '}
                em Brasília.
              </p>
            </Item>
          </Jobs>
          <Contacts>
            <ItemContact>
              <FaMapPin />
              <h3>Onde estou?</h3>
              <p>
                Em Brasília, DF
                <br />
                Brasil
                <br />
                Terra
              </p>
            </ItemContact>
            <ItemContact>
              <FaRegEnvelope />
              <h3>Email me</h3>
              <p>
                <a href="mailto: pleybsb@gmail.com">pleybsb@gmail.com</a>
                <br />
                <a href="mailto: farmazil.vendas@gmail.com">
                  farmazil.vendas@gmail.com
                </a>
              </p>
            </ItemContact>
            <ItemContact>
              <FaPhoneAlt />
              <h3>Zap me</h3>
              <p>
                <a href="tel: 5561992727799">(61) 9 9272-7799</a>
              </p>
            </ItemContact>
          </Contacts>
          <p>
            © Designed by <a href="mailto: micpopolin@gmail.com">Popolin</a>.
          </p>
        </Footer>
      </Container>
    </>
  );
};

export default Home;
