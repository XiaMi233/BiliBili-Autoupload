import {createStore} from 'redux'
import throttle from 'lodash/throttle';
import todoApp from 'reducers/index';
import {loadState, saveState} from 'localStorage';

const configureStore = () => {
  const persistedState = loadState();
  const store = createStore(
    todoApp,
    persistedState
  );

  store.subscribe(throttle(() => {
    saveState({
      todos: store.getState().todos
    });
  }, 1000));
  store.subscribe(() =>
    console.log(store.getState())
  );

  return store;
};

export default configureStore;
