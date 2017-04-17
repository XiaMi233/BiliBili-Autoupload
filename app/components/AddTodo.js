import {connect} from 'react-redux';
import {addTodo} from 'actions/index';

let AddTodo = ({
  dispatch
}) => {
  let input;
  return (
    <div>
      <input type="text" ref={node => {
        input = node;
      }} />
      <button
        type="submit"
        onClick={() => {
          if (input.value) {
            dispatch(addTodo(input.value));
          }
          input.value = '';
        }}
      >
        addTodo
      </button>
    </div>
  );
};
AddTodo = connect()(AddTodo);

export default AddTodo;
