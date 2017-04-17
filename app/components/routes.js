import { Route } from 'react-router';

const routes = (App) => (<Route path="/(:filter)" component={App} />);

export default routes;
