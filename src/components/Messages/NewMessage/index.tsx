import React, { useCallback } from 'react';

import { FaUserAlt, FaPencilAlt } from 'react-icons/fa';

import { Form } from '@unform/web';

import { saveMessage } from '../../../services/api';

import Input from '../../Input';

import { Container } from './styles';
import { MessageProps } from '../Message';

type CloseFunctionType = (newMessage: MessageProps | null) => void;

interface NewMessageProps {
  onClose: CloseFunctionType;
}

const NewMessage: React.FC<NewMessageProps> = ({ onClose }) => {
  const handleSave = useCallback(
    async data => {
      const newMessage = await saveMessage(data);
      onClose(newMessage);
    },
    [onClose],
  );

  return (
    <Container>
      <h3>Nova Mensagem</h3>
      <hr />
      <Form onSubmit={handleSave}>
        <Input name="from" icon={FaUserAlt} placeholder="Seu nome" />
        <Input name="message" icon={FaPencilAlt} placeholder="Mensagem" />
        <footer>
          <button type="button" onClick={() => onClose(null)}>
            Fechar
          </button>
          <button type="submit">Salvar</button>
        </footer>
      </Form>
    </Container>
  );
};

export default NewMessage;
