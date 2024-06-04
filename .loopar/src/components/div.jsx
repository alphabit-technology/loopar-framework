import Component from "$component";
import { loopar } from "$loopar";

export default class DivComponent extends Component {
   blockComponent = true;

   render(content = null) {
      return super.render(
        <div
          {...loopar.utils.renderizableProps(this.props)}
        >
         {this.elements}
         {content}
        </div>
      );
   }
}