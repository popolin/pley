import React from 'react';

import Message, { MessageProps } from './Message';
import { Container, Title, Footer } from './styles';

interface MessagesProps {
  messages?: MessageProps[];
}

const Messages: React.FC<MessagesProps> = ({ messages }) => (
  <Container>
    <Title>
      <h3>Quadro de Mensagens:</h3>
    </Title>
    {messages?.map((message, index) => (
      <Message dark={index % 2 === 1} message={message} key={message.id} />
    ))}
    <Footer />
  </Container>
);

export default Messages;
