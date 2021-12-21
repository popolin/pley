import React from 'react';
import { Switch } from 'react-router-dom';

import Route from './Route';

import ReciboPage from '../pages/Recibo';
import MemoPage from '../pages/Memo';

const Routes: React.FC = () => (
  <Switch>
    <Route exact path="/receipt" component={ReciboPage} />
    <Route path="/" component={MemoPage} />
  </Switch>
);

export default Routes;
