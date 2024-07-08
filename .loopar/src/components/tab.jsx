import Component from "@component";
import { Droppable } from "$droppable";

export default class Tab extends Component {
  render() {
    return (
      <Droppable
        {...this.props}
        receiver={this}
      />
    )
  } 
}
