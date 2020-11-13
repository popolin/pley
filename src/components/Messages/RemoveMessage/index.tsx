import React, { useCallback, useState } from 'react';

import { format } from 'date-fns';

import { Form } from '@unform/web';

import { FaLock } from 'react-icons/fa';

import Input from '../../Input';

import { removeMessage } from '../../../services/api';

import { Container } from './styles';
import { MessageProps } from '../Message';

type CloseFunctionType = (removed: boolean) => void;

interface RemoveMessageProps {
  onClose: CloseFunctionType;
  message: MessageProps;
}

const RemoveMessage: React.FC<RemoveMessageProps> = ({ onClose, message }) => {
  const [error, setError] = useState<string | null>(null);

  const handleRemove = useCallback(
    async data => {
      const { password } = data;
      const currentPass = format(new Date(), 'HHmm');
      if (password.length === 0) {
        setError('Informe  a senha');
        return;
      }
      if (currentPass !== password) {
        setError('Senha inválida');
        return;
      }
      const removed = await removeMessage(message.id);
      onClose(removed);
    },
    [message, onClose],
  );

  return (
    <Container>
      <h3>Remoção de Mensagem</h3>
      <hr />
      <p>
        Para remover a mensagem de <strong>{message.from}</strong>:
        <br />
        <i>
          <strong>{message.message}</strong>
        </i>
        <br />
        Digite a senha e confirme:
      </p>
      <Form onSubmit={handleRemove}>
        <Input name="password" icon={FaLock} placeholder="Senha de Admin" />
        {error && <h6>{error}</h6>}
        <footer>
          <button type="button" onClick={() => onClose(false)}>
            Fechar
          </button>
          <button type="submit">Confirmar</button>
        </footer>
      </Form>
    </Container>
  );
};

export default RemoveMessage;
