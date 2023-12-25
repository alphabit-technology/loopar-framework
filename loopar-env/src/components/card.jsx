import Component from "#component"

export default class Card extends Component {
   blockComponent = true;
   className = "card card-fluid";
   dontHaveMetaElements = ["text"]

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         collapsed: false,
      }
   }

   render() {
      return super.render(
         <>
            <div className="card-header">
               <h6>
                  <a
                     className="btn btn-reset"
                     onClick={() => {
                        this.toggleHide();
                     }}
                  >
                     <span className="mr-2">{data.label}</span>
                     <span className="collapse-icon ml-2">
                        <i
                           className={`fas fa-chevron-${this.state.collapsed ? "down" : "up"}`}
                           onClick={() => {
                              this.toggleHide();
                           }}
                        />
                     </span>
                  </a>
               </h6>
            </div>
            <div
               ref={(el) => (this.container = el)}
               className={`card-body collapse show element sub-element ${this.props.bodyClassName || ""}`}
               style={this.state.collapsed ? { display: "none" } : {}}
            >
               {this.props.children}
               {content}
               {this.elements}
            </div>
         </>
      );
   }

   toggleHide() {
      this.setState({ collapsed: !this.state.collapsed });
   }
}

export const card = (options) => {
   return new Card(options);
}