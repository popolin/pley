import React from 'react';
import 'antd/dist/antd.css';

import GlobalStyle from './styles/global';

// import Home from './pages/Home';
// import Recibo from './pages/Recibo';
// import Out from './pages/Out';
import Memo from './pages/Memo';

const App: React.FC = () => (
  <>
    {/* <Home /> */}
    {/* <Recibo /> */}
    <Memo />
    <GlobalStyle />
  </>
);

export default App;
