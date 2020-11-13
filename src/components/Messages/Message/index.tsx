import React, { useCallback } from 'react';

import { format } from 'date-fns';

import { FaTimes } from 'react-icons/fa';

import { Container } from './styles';

type SelectFunctionType = (message: MessageProps) => void;

export interface MessageProps {
  id: string;
  from: string;
  message: string;
  created_at: Date;
}

interface RequestProps {
  dark?: boolean;
  message: MessageProps;
  onDelete: SelectFunctionType;
}

const Message: React.FC<RequestProps> = ({
  dark = false,
  message,
  onDelete,
}) => {
  const date = new Date(message.created_at);

  const handleRemoveMessage = useCallback(() => {
    onDelete(message);
  }, [message, onDelete]);

  return (
    <Container dark={dark}>
      <div>
        <h3>{message.from}</h3>
        <div>
          <h6>{format(date, 'dd/MM/yyyy HH:mm')}</h6>
          <button type="button" onClick={handleRemoveMessage}>
            <FaTimes />
          </button>
        </div>
      </div>
      <p>{message.message}</p>
    </Container>
  );
};

export default Message;
