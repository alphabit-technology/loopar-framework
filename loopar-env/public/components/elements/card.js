import { a, h6, i, span } from "../elements.js";
import { div } from "../elements.js";
import Component from "../base/component.js";

export default class Card extends Component {
   blockComponent = true;
   className = "card card-fluid";

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         collapsed: false,
      }
   }

   render(content = null) {
      const data = this.props.meta.data;

      return super.render([
         div({ className: 'card-header' },
            h6(
               a({
                  className: "btn btn-reset",
                  onClick: () => {
                     this.toggleHide();
                  }
               }, [
                  span({ lassName: 'mr-2' },
                     data.label
                  ),
                  span({ className: 'collapse-icon ml-2' },
                     i({
                        className: `fas fa-chevron-${this.state.collapsed ? "down" : "up"}`,
                        onClick: () => {
                           this.toggleHide();
                        }
                     })
                  )
               ])
            )
         ),
         div({
            Component: this,
            ref: el => this.container = el,
            className: "card-body collapse show element sub-element" + (this.props.bodyClassName || ""),
            style: this.state.collapsed ? { display: "none" } : {}
         }, [
            this.props.children,
            content,
            this.elements
         ])
      ]);
   }

   toggleHide() {
      this.setState({ collapsed: !this.state.collapsed });
   }
}

export const card = (options) => {
   return new Card(options);
}