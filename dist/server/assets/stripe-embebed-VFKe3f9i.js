import { C as Component } from "./component-hNq1V6er.js";
import { l as loopar } from "../entry-server.js";
import React__default from "react";
import "react/jsx-runtime";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
class StripeEmbebedClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      open: props.open
    };
  }
  get open() {
    return this.state.open === true;
  }
  render() {
    const data = this.props.data;
    return super.render([
      React__default.createElement("stripe-pricing-table", {
        "pricing-table-id": data.pricing_table_id,
        "publishable-key": data.publishable_key
      })
    ]);
  }
  componentDidMount() {
    super.componentDidMount();
    loopar.require("https://js.stripe.com/v3/pricing-table");
  }
  get metaFields() {
    return [
      {
        group: "custom",
        elements: {
          pricing_table_id: { element: INPUT },
          publishable_key: { element: INPUT }
        }
      }
    ];
  }
}
const StripeEmbedebComponent = (props) => {
  return React__default.createElement(StripeClass, props);
};
export {
  StripeEmbedebComponent,
  StripeEmbebedClass as default
};
