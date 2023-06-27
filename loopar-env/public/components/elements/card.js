import {a, h6, i, span} from "../elements.js";
import {div} from "../elements.js";
import Component from "../base/component.js";
import {Element} from "/components/elements.js";

export default class Card extends Component {
   block_component = true;
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
         div({className: 'card-header'},
            h6(
               a({
                  className: "btn btn-reset",
                  onClick: () => {
                     this.toggle_hide();
                  }
               }, [
                  span({lassName: 'mr-2'},
                     data.label
                  ),
                  span({className: 'collapse-icon ml-2'},
                     i({
                        className: `fas fa-chevron-${this.state.collapsed ? "down" : "up"}`,
                        onClick: () => {
                           this.toggle_hide();
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
            style: this.state.collapsed ? {display: "none"} : {}
         }, [
            this.props.children,
            content,
            this.elements
         ])
      ]);
   }

   toggle_hide() {
      this.setState({collapsed: !this.state.collapsed});
   }
}

export const card = (options) => {
   return new Card(options);
}