import Component from "$component";
import { Droppable } from "$droppable";

export default class Fragment extends Component {
  render() {
    return (
      <Droppable Component="fragment" {...this.props}/>
    );
  }
}