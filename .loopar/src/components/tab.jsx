import Component from "@component";
import { Droppable } from "$droppable";

export default class Tab extends Component {
  render() {
    return (
      <Droppable
        receiver={this}
      >
        {this.props.children || this.elements}
      </Droppable>
    )
  } 
}
