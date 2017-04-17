import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';
import { Router, useRouterHistory } from 'react-router';
import App from './App';
import { createHistory } from 'history'

const history = useRouterHistory(createHistory)({
  basename: '/index.html'
});


const Root = ({store, routes}) => (
  <AppContainer>
    <Provider store={store}>
      <Router history={history}>
        {routes(App)}
      </Router>
    </Provider>
  </AppContainer>
);

export default Root;
