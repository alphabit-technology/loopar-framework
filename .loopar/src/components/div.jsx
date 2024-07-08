import Component from "$component";
import { loopar } from "$loopar";
import { Droppable } from "$droppable";

export default class DivComponent extends Component {
   blockComponent = true;

   render(content = null) {
    return (
      <Droppable
        {...this.props}
        receiver={this}
      />
    )
   }
}