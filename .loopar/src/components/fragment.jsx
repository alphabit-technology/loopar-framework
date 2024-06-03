import Component from "$component";
import { Droppable } from "$droppable";

export default class Fragment extends Component {
  render(content = null) {
    return (
      <Droppable Component="fragment" receiver={this}>
        {this.elements}
        {content}
      </Droppable>
    );
  }
}