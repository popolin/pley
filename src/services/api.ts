import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pley.glitch.me',
});

export default api;
