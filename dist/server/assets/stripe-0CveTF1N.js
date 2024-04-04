var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { C as Component } from "./component-hNq1V6er.js";
import { l as loopar } from "../entry-server.js";
import { Modal } from "./dialog-nmg_tOQf.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react";
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
import "./dialog-9N_htvR6.js";
import "@radix-ui/react-dialog";
import "./x-3j0F7ehT.js";
import "./input-LY3ihqM_.js";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
class StripeClass extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "className", "");
    __publicField(this, "stripeElementsList", []);
    __publicField(this, "completeComponent", false);
    this.state = {
      ...this.state,
      open: props.open
    };
  }
  get open() {
    return this.state.open === true;
  }
  render(content = null) {
    const data = this.props.data;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: this.props.buttonClassName || "btn btn-primary btn-block",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.setState({
              open: true
            });
          },
          children: [
            /* @__PURE__ */ jsx("span", { className: "fas fa-lock mr-2" }),
            /* @__PURE__ */ jsx("span", { children: data.label })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Modal,
        {
          size: "md",
          title: this.data.label || "Payment",
          id: "payment_modal",
          open: this.open,
          icon: "fa fa-lock",
          onClose: () => {
            this.setState(
              {
                open: false
              },
              () => {
                this.props.onClose && this.props.onClose();
              }
            );
          },
          hasFooter: false,
          buttons: [],
          onShow: () => {
            this.makeStripeComponent();
          },
          children: [
            /* @__PURE__ */ jsx("small", { className: "text-muted", children: "Your payment is secure with us. We've partnered with Stripe, a trusted and industry-leading payment platform. Rest assured that your transaction is protected by Stripe's state-of-the-art security measures. Your trust and peace of mind are our top priorities." }),
            /* @__PURE__ */ jsx(
              "form",
              {
                className: "card-form",
                action: data.action,
                method: data.method,
                ref: (form) => {
                  if (form)
                    this.form = form;
                },
                children: /* @__PURE__ */ jsx("div", { className: "card-body", children: /* @__PURE__ */ jsxs("div", { className: "row", children: [
                  /* @__PURE__ */ jsxs("div", { className: "col-12", children: [
                    /* @__PURE__ */ jsx("div", { className: "form-group", children: /* @__PURE__ */ jsx("div", { className: "row", children: /* @__PURE__ */ jsx(
                      "input",
                      {
                        className: "form-control",
                        name: "name",
                        type: "text",
                        placeholder: "Name on card",
                        "aria-label": "Name on card"
                      }
                    ) }) }),
                    /* @__PURE__ */ jsx("div", { className: "form-group", children: /* @__PURE__ */ jsx("div", { className: "row", children: /* @__PURE__ */ jsx("div", { className: "form-control", style: { height: 55 }, children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        id: "card-element",
                        "aria-label": "Credit or debit card",
                        style: { color: "#fff" },
                        ref: (card) => {
                          if (card) {
                            this.card = card;
                          }
                        }
                      }
                    ) }) }) }),
                    /* @__PURE__ */ jsx("div", { className: "form-group", children: /* @__PURE__ */ jsx("div", { className: "row", children: /* @__PURE__ */ jsxs(
                      "button",
                      {
                        className: "btn btn-primary btn-block",
                        type: "submit",
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "fas fa-lock mr-2" }),
                          /* @__PURE__ */ jsx("span", { children: "Pay $25" })
                        ]
                      }
                    ) }) }),
                    /* @__PURE__ */ jsx("div", { className: "form-group", children: /* @__PURE__ */ jsx("div", { className: "row", children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        role: "alert",
                        ref: (messageContainter) => this.messageContainter = messageContainter
                      }
                    ) }) })
                  ] }),
                  /* @__PURE__ */ jsx("div", { id: "payment-request-button" }),
                  /* @__PURE__ */ jsx("div", { className: "col-12 text-center", children: /* @__PURE__ */ jsx("span", { className: "fab fa-stripe fa-5x" }) })
                ] }) })
              }
            )
          ]
        }
      )
    ] });
  }
  componentDidUpdate() {
    var _a;
    super.componentDidUpdate();
    const theme2 = localStorage.getItem("skin");
    if (this.theme === theme2)
      return;
    this.theme = theme2;
    (_a = this.stripeElementsList.card) == null ? void 0 : _a.update({
      style: {
        base: {
          color: theme2 === "dark" ? "#fff" : "#000",
          iconColor: theme2 === "dark" ? "#fff" : "#000",
          "::placeholder": {
            color: theme2 === "dark" ? "" : "#42425da9"
          }
        }
      }
    });
  }
  addMessage(message) {
    this.messageContainter.node.style.display = "block";
    this.messageContainter.node.innerHTML += ">" + message + "<br>";
  }
  async makeStripeComponent() {
    if (!this.card.node || this.completeComponent || this.props.designer)
      return;
    this.completeComponent = true;
    this.theme = localStorage.getItem("skin");
    const key = "pk_test_51NK8ILAxg5LsnkU6R3Q7gsH2lEFxQpNr4TkIjebYgbnAOVwHphL7mtT7aUWYA8v40EMVE3ihTE5XK0nLVx90fKvg00LN8ONS2m";
    this.stripe = Stripe(key);
    this.stripe_elements = this.stripe.elements();
    const base = {
      color: theme === "dark" ? "#fff" : "#000",
      iconColor: theme === "dark" ? "#fff" : "#000",
      "::placeholder": {
        color: theme === "dark" ? "" : "#42425da9"
      }
    };
    this.stripeElementsList["card"] = this.stripe_elements.create("card", {
      hidePostalCode: true,
      style: {
        base: {
          iconColor: "white",
          color: "white",
          backGroundColor: "#2d2d3f",
          lineHeight: "40px",
          fontWeight: 300,
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSize: "15px",
          "::placeholder": {
            //color: '#42425da9',
          },
          ...base
        }
      }
    });
    this.stripeElementsList.card.mount(this.card.node);
    this.form.node.addEventListener("submit", async (event) => {
      event.preventDefault();
      const { message: stripeData } = await loopar.method(
        "Stripe",
        "clientSecret"
      );
      const clientSecret = stripeData.client_secret;
      const nameIput = this.form.node.querySelector('input[name="name"]');
      const { error: stripeError, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.stripeElementsList.card,
          billing_details: {
            name: nameIput.value
          }
        }
      });
      if (stripeError) {
        loopar.dialog({
          title: "Error",
          type: "error",
          content: stripeError.message
        });
        return;
      } else {
        loopar.dialog({
          title: "Success",
          type: "success",
          content: "Payment success"
        });
        this.setState({
          open: false
        });
        return;
      }
    });
  }
  componentDidMount() {
    super.componentDidMount();
  }
}
const StripeComponent = (props) => {
  return React.createElement(StripeClass, props);
};
export {
  StripeComponent,
  StripeClass as default
};
