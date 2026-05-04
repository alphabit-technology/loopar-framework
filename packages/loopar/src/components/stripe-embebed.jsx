import Component from "@component";
import loopar from "loopar";
import React from "react";

export default class StripeEmbebedClass extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      open: props.open,
    };
  }

  get open() {
    return this.state.open === true;
  }

  render() {
    const data = this.props.data;

    return ([
      React.createElement("stripe-pricing-table", {
        "pricing-table-id": data.pricing_table_id,
        "publishable-key": data.publishable_key,
      }),
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
          publishable_key: { element: INPUT },
        },
      },
    ];
  }
}

export const StripeEmbedebComponent = (props) => {
  return React.createElement(StripeClass, props);
};
