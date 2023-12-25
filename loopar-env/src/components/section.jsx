import Component from "#component";
import Div from "#div";

export default class Section extends Component {
   blockComponent = true;
   className = "section position-relative py-5 bg-light h-100";

   constructor(props) {
      super(props);
   }

   render(content = null) {
      return super.render(
         <div className="container position-relative h-100">
            <Div className="element align-items-center justify-content-between element sub-element h-100" ref={self => this.container = self} Component={this}>
               {this.props.children}
               {content}
               {this.elements}
            </Div>
         </div>
      )
   }
}