import React from 'react';
import 'antd/dist/antd.css';

import GlobalStyle from './styles/global';

// import Home from './pages/Home';
import Recibo from './pages/Recibo';

const App: React.FC = () => (
  <>
    {/* <Home /> */}
    <Recibo />
    <GlobalStyle />
  </>
);

export default App;
