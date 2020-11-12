import axios from 'axios';
import { client, q } from '../config/db';

import { MessageProps } from '../components/Messages/Message';

interface MessageRequestProps {
  data: MessageProps;
}

interface ResponseFaunaProps {
  data: MessageRequestProps[];
}

const username = process.env.REACT_APP_DB_USERNAME;

const api = axios.create({
  baseURL: 'https://pley.glitch.me',
});

export const getMessages = async (): Promise<MessageProps[]> => {
  console.log(`getResumeNode: username(${username})`);
  try {
    const ret = await client.query<ResponseFaunaProps>(
      q.Map(
        q.Paginate(q.Documents(q.Collection('messages'))),
        q.Lambda(x => q.Get(x)),
      ),
    );
    const msgs = ret.data;
    const parsedMsgs = msgs.map(msg => msg.data);
    return parsedMsgs;
  } catch (error) {
    return [];
  }
};

export default api;
