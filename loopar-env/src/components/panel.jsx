import Component from "#component";

export default class Panel extends Component {
   blockComponent = true;
   className = "card card-fluid";
   constructor(props) {
      super(props);
   }

   render(content) {
      return super.render(
         <div className="card-body element sub-element show" ref={self => this.container = self} Component={this}>
            {this.props.children}
            {content}
            {this.elements}
         </div>
      )
   }
}