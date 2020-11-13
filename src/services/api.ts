import axios from 'axios';
import { v4 } from 'uuid';
import { formatISO, isBefore } from 'date-fns';
import { client, q } from '../config/db';

import { MessageProps } from '../components/Messages/Message';

interface RefFaunaRequest {
  value: { id: string };
}

interface MessageRequestProps {
  data: MessageProps;
  ref: RefFaunaRequest;
}

interface ResponseFaunaProps {
  data: MessageRequestProps[];
}

const api = axios.create({
  baseURL: 'https://pley.glitch.me',
});

export const getMessages = async (): Promise<MessageProps[]> => {
  try {
    const ret = await client.query<ResponseFaunaProps>(
      q.Map(
        q.Paginate(q.Documents(q.Collection('messages'))),
        q.Lambda(x => q.Get(x)),
      ),
    );
    const msgs = ret.data;
    const parsedMsgs = msgs.map(msg => {
      const { data } = msg;
      data.id = msg.ref.value.id;
      return data;
    });

    return parsedMsgs.sort((o1, o2) => {
      const dt1 = new Date(o1.created_at);
      const dt2 = new Date(o2.created_at);
      return isBefore(dt1, dt2) ? 1 : -1;
    });
  } catch (error) {
    return [];
  }
};

export const saveMessage = async ({
  from,
  message,
}: MessageProps): Promise<MessageProps | null> => {
  try {
    const id = v4();
    const created_at = formatISO(new Date());
    const retorno = await client.query<MessageRequestProps>(
      q.Create(q.Collection('messages'), {
        data: { id, from, message, created_at },
      }),
    );
    return retorno.data;
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const removeMessage = async (id: string): Promise<boolean> => {
  try {
    const retorno = await client.query<MessageRequestProps>(
      q.Delete(q.Ref(q.Collection('messages'), id)),
    );
    console.log(retorno);
    return !!retorno.data;
  } catch (error) {
    console.error(error);
  }
  return false;
};

export default api;
