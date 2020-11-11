import React, { useCallback, useState } from 'react';
import api from '../../services/api';

import Loading from '../Loading';

import { Container, Button, Guess, Question, Answer } from './styles';

type CloseFunctionType = () => void;

interface JogoProps {
  onClose: CloseFunctionType;
}

interface AkiProps {
  session: string;
  question: string;
  answers: string[];
  progress: string;
  currentStep: number;
}

interface GuessProps {
  id: string;
  name: string;
  description: string;
  proba: string;
  absolute_picture_path: string;
}

const Jogo: React.FC<JogoProps> = ({ onClose }) => {
  const [wrongGuess, setWrongGuess] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [guess, setGuess] = useState<GuessProps | null>(null);
  const [aki, setAki] = useState<AkiProps | null>(null);

  const handleAnswer = useCallback(
    async (answer: number) => {
      setLoading(true);
      try {
        const response = await api.post(`/aki/${aki?.session}/${answer}`);
        const newAki = response.data;
        if (newAki) {
          const guesses = newAki.answers.map((inGuess: GuessProps) => ({
            id: inGuess.id,
            name: inGuess.name,
            proba: inGuess.proba,
            description: inGuess.description,
            absolute_picture_path: inGuess.absolute_picture_path,
          }));
          const newGuess = guesses.find(
            (inGuess: GuessProps) =>
              !!inGuess.id &&
              parseFloat(inGuess.proba) > 0.95 &&
              !wrongGuess.includes(inGuess.id),
          );
          console.log(newGuess);
          if (newGuess) {
            setGuess(newGuess);
          } else {
            setAki(newAki);
          }
        }
      } catch (err) {
        console.error(err);
        alert('Infelizmente o jogo está funcionando corretamente. =(');
      }
      setLoading(false);
    },
    [aki?.session, wrongGuess],
  );

  const handleClose = useCallback(async () => {
    setAki(null);
    setGuess(null);
    onClose();
  }, [onClose]);

  const handleContinuar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/aki');
      const newAki = response.data;
      if (newAki) {
        setAki(newAki);
      }
    } catch (err) {
      console.error(err);
      alert('Infelizmente o jogo está funcionando corretamente. =(');
    }
    setLoading(false);
  }, []);

  const handleErrou = useCallback(async () => {
    if (guess) {
      setWrongGuess(oldWrongs => [...oldWrongs, guess.id]);
      setGuess(null);
    }
  }, [guess]);

  return (
    <>
      <Container>
        {loading && <Loading />}
        <h1>Jogo dos Personagens</h1>
        <div style={{ opacity: loading ? 0.05 : 1 }}>
          {!!aki && !!guess && (
            <>
              <Question>
                <h3>
                  Seu personagem é <strong>{guess.name}</strong> de{' '}
                  <strong>
                    {guess.description && guess.description !== '-'
                      ? guess.description
                      : 'descrição desconhecida'}
                  </strong>
                  ?
                </h3>
              </Question>
              <Guess>
                <img src={guess.absolute_picture_path} alt="Personagem" />
              </Guess>
            </>
          )}
          {!!aki && !guess && (
            <div>
              <Question>
                <h3>{aki.question}</h3>
              </Question>
              <ul>
                <Answer onClick={() => handleAnswer(0)}>
                  <h3>Sim</h3>
                </Answer>
                <Answer onClick={() => handleAnswer(1)}>
                  <h3>Não</h3>
                </Answer>
                <Answer onClick={() => handleAnswer(2)}>
                  <h3>Não sei</h3>
                </Answer>
                <Answer onClick={() => handleAnswer(3)}>
                  <h3>Provavelmente sim</h3>
                </Answer>
                <Answer onClick={() => handleAnswer(4)}>
                  <h3>Provavelmente não</h3>
                </Answer>
              </ul>
            </div>
          )}

          {!aki && (
            <>
              <h4>
                Pense em qualquer personagem: real, fictício, vivo, morto,
                desenho animado... Qualquer um.
              </h4>
              <h4>Agora decore seu personagem e clique em Continuar:</h4>
              <br />
            </>
          )}

          <footer>
            <Button theme="dark" onClick={() => handleClose()}>
              Fechar
            </Button>
            {!!aki && !!guess && (
              <div>
                <Button theme="error" onClick={handleErrou}>
                  Não
                </Button>
                <Button theme="success" onClick={handleClose}>
                  Sim!
                </Button>
              </div>
            )}
            {!aki ? (
              <Button onClick={handleContinuar}>Continuar</Button>
            ) : (
              <></>
            )}
          </footer>
        </div>
      </Container>
    </>
  );
};

export default Jogo;
