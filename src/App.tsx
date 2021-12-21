import React from 'react';
import 'antd/dist/antd.css';

import { BrowserRouter } from 'react-router-dom';
import GlobalStyle from './styles/global';

import Routes from './routes';

const App: React.FC = () => (
  <BrowserRouter>
    <Routes />
    <GlobalStyle />
  </BrowserRouter>
);

export default App;
