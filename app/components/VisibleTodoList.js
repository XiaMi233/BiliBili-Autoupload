import {connect} from 'react-redux';
import { withRouter } from 'react-router';
import {toggleTodo} from 'actions/index';
import { getVisibleTodos } from '../reducers/index';
import TodoList from './TodoList';

const mapStateToTodoListProps = (state, ownProps) => ({
  todos: getVisibleTodos(state, ownProps.params.filter || 'all')
});
// const mapDispatchToTodoListProps = (dispatch) => ({
//   onTodoClick(id) {
//     dispatch(toggleTodo(id));
//   }
// });
const VisibleTodoList = withRouter(connect(
  mapStateToTodoListProps,
  {
    onTodoClick: toggleTodo
  }
)(TodoList));

export default VisibleTodoList;
