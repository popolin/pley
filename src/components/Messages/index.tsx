import React, { useEffect, useState, useCallback } from 'react';
import { FaPlusCircle } from 'react-icons/fa';

import Message, { MessageProps } from './Message';
import { Container, Title, Footer } from './styles';

import { getMessages } from '../../services/api';

import NewMessage from './NewMessage';
import RemoveMessage from './RemoveMessage';

const Messages: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<MessageProps | null>(
    null,
  );
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    getMessages().then(data => {
      setMessages(data);
    });
  }, []);

  const handleRemoveMessage = useCallback(
    removed => {
      if (selectedMessage && removed) {
        const newMessages = messages.filter(
          message => message.id !== selectedMessage.id,
        );
        setMessages(newMessages);
      }
      setSelectedMessage(null);
    },
    [messages, selectedMessage],
  );

  const handleNewMessage = useCallback(
    newMessage => {
      if (newMessage) {
        setMessages([newMessage, ...messages]);
      }
      setShowNewMessage(false);
    },
    [messages],
  );

  return (
    <Container>
      {showNewMessage && (
        <NewMessage onClose={message => handleNewMessage(message)} />
      )}
      {selectedMessage && (
        <RemoveMessage
          onClose={removed => handleRemoveMessage(removed)}
          message={selectedMessage}
        />
      )}

      <Title>
        <h3>Quadro de Mensagens:</h3>
        <button type="button" onClick={() => setShowNewMessage(true)}>
          Nova
          <FaPlusCircle />
        </button>
      </Title>
      {messages?.map((message, index) => (
        <Message
          onDelete={() => setSelectedMessage(message)}
          dark={index % 2 === 1}
          message={message}
          key={message.id}
        />
      ))}
      <Footer />
    </Container>
  );
};

export default Messages;
