/* eslint-disable default-case */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router';

import { Button, notification } from 'antd';
import { shuffle } from 'lodash';

import Rua from './images/rua';
import Jovens from './images/jovens';
import Lemos from './images/lemos';

import {
  Container,
  Board,
  Stats,
  Card,
  CardOuter,
  SelectGroup,
  Groups,
} from './styles';
import { IImage } from './images/imageDTO';

interface IGroup {
  name: string;
  key: string;
  group: IImage[];
}

const allGroups = [
  {
    name: 'Das antigas',
    key: 'antigas',
    group: Rua,
  },
  {
    name: 'Jovens Mendes',
    key: 'jovens',
    group: Jovens,
  },
  {
    name: 'Família Lemos',
    key: 'lemos',
    group: Lemos,
  },
] as IGroup[];

const Memo: React.FC = () => {
  const { pathname } = useLocation();
  const history = useHistory();

  const [cards, setCards] = useState<string[]>([]);
  const [clicks, setClicks] = useState(0);
  const [won, setWon] = useState(false);
  const [activeCards, setActiveCards] = useState<number[]>([]);
  const [foundPairs, setFoundPairs] = useState<number[]>([]);
  const [group, setGroup] = useState<IGroup>();

  const handleSelectGroup = useCallback(
    (path: string) => {
      history.push({
        pathname: path,
      });
    },
    [history],
  );

  const handleShowGroup = useCallback((name: string) => {
    const selected = allGroups.find(ag => ag.key === name);
    if (selected) {
      setGroup(selected);
      const images = selected.group.map(a => a.image);
      setCards(shuffle([...images, ...images]));
    }
  }, []);

  useEffect(() => {
    console.log('pathname', pathname);
    if (pathname) {
      handleShowGroup(pathname.substring(1));
    }
  }, [handleShowGroup, pathname]);

  const flipCard = useCallback(
    (index: number) => {
      if (activeCards.includes(index) || foundPairs.includes(index)) {
        return;
      }
      if (won && group) {
        const images = group.group.map(a => a.image);
        setCards(shuffle([...images, ...images]));
        setFoundPairs([]);
        setWon(false);
        setClicks(0);
      }
      if (activeCards.length === 0) {
        setActiveCards([index]);
      }
      if (activeCards.length === 1) {
        const firstIndex = activeCards[0];
        const secondsIndex = index;
        if (cards[firstIndex] === cards[secondsIndex]) {
          if (foundPairs.length + 2 === cards.length) {
            setWon(true);
          }
          const foundCard = group?.group.find(
            a => a.image === cards[secondsIndex],
          );
          if (foundCard) {
            notification.info({
              message: `Encontrou o(a) ${foundCard.name}`,
            });
          }
          setFoundPairs([...foundPairs, firstIndex, secondsIndex]);
        }
        setActiveCards([...activeCards, index]);
      }
      if (activeCards.length === 2) {
        setActiveCards([index]);
      }
      setClicks(clicks + 1);
    },
    [activeCards, cards, clicks, foundPairs, group, won],
  );

  const ifFlipped = useCallback(
    (index: number) => {
      const active = activeCards.indexOf(index) !== -1;
      const pair = foundPairs.indexOf(index) !== -1;
      return active || pair;
    },
    [activeCards, foundPairs],
  );

  return (
    <Container>
      {!group && (
        <SelectGroup>
          <span>De onde?</span>
          <Groups>
            {allGroups.map((ag, idx) => (
              <Button
                key={`btn_${idx}`}
                size="large"
                style={{
                  marginBottom: 12,
                }}
                onClick={() => handleSelectGroup(ag.key)}
              >
                {ag.name}
              </Button>
            ))}
          </Groups>
        </SelectGroup>
      )}
      {!!group && (
        <>
          <Stats>{group.name}</Stats>
          <Board>
            {cards.map((card, index) => (
              <CardOuter
                key={`card_${index}`}
                flipped={ifFlipped(index)}
                onClick={() => flipCard(index)}
              >
                <Card flipped={ifFlipped(index)}>
                  <div className="front">
                    <img src={card} alt="" />
                  </div>
                  <div className="back" />
                </Card>
              </CardOuter>
            ))}
          </Board>
          <Stats>
            {won && (
              <>
                Aeeeee, ganhou! Inteligente demais!
                <br />
                Clica ae em qualquer carta que começa de novo.
                <br />
                <br />
              </>
            )}
            Cliques: {clicks} &nbsp;&nbsp;&nbsp; Pares: &nbsp;
            {foundPairs.length / 2}
          </Stats>
        </>
      )}
    </Container>
  );
};

export default Memo;
