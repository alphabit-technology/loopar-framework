'use strict';
import {span, button} from '/components/elements.js';
import Div from '/components/elements/div.js';

class WebMenuClass extends Div {
   className = "container-menu";

   constructor(props) {
      super(props);
   }

   render() {
      const data = this.data;

      return super.render(
         [
            button({className: "hamburger hamburger-squeeze hamburger-light d-flex d-lg-none collapsed", type: "button",
                    dataToggle: "collapse", dataTarget: "#navbarTogglerDemo01", ariaControls: "navbarTogglerDemo01",
                    ariaExpanded: "false", ariaLabel: "Toggle navigation"},
               span({className: "hamburger-box"},
                  span({className: "hamburger-inner"})
               )
            ),
         ]
      )
   }
}

export const WebMenu = (props, content) => {
   return React.createElement(WebMenuClass, props, content);
}