import {a, h6, i, span, form, button, input, small, p} from "../elements.js";
import {div} from "../elements.js";
import Component from "../base/component.js";
import { loopar } from "/loopar.js";
import { Modal } from "../common/dialog.js";

export default class StripeClass extends Component {
   className = "";
   stripeElementsList = [];
   completeComponent = false;

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         open: props.open,
      }
   }

   get open() {
      return this.state.open === true;
   }

   render(content = null) {
      const data = this.props.meta.data;

      return ([
         button({
            className: this.props.buttonClassName || "btn btn-primary btn-block",
            onClick: (e) => {
               e.preventDefault();
               e.stopPropagation();
               this.setState({
                  open: true
               });
            }
         }, [
            span({className: "fas fa-lock mr-2"}),
            span(data.label)
         ]),
         Modal({
            size: "md",
            title: this.data.label || "Payment",
            id: "payment_modal",
            open: this.open,
            icon: "fa fa-lock",
            onClose: () => {
               this.setState({
                  open: false
               }, () => {
                  this.props.onClose && this.props.onClose();
               });
            },
            hasFooter: false,
            buttons: [],
            onShow: () => {
               this.makeStripeComponent();
            },
            /*buttons: [
               {
                  text: 'OK',
                  onClick: () => {
                     this.props.onOk && this.props.onOk();
                  },
                  dismiss: true
               },
               {
                  text: 'Cancel',
                  onClick: () => {
                     this.props.onCancel && this.props.onCancel();
                  },
                  dismiss: true
               }
            ],*/
         }, [
            small({className: "text-muted"}, [
               "Your payment is secure with us. We've partnered with Stripe, a trusted and industry-leading payment platform. Rest assured that your transaction is protected by Stripe's state-of-the-art security measures. Your trust and peace of mind are our top priorities."
            ]),
            form({
               className: 'card-form', 
               action: data.action, 
               method: data.method, 
               ref: form => {
                  if(form) this.form = form;
               }
            }, [
               /*div({className: 'card-header'},
                  h6(
                     span({lassName: 'mr-2'},
                        data.label
                     )
                  )
               ),*/
               div({
                  className: "card-body"
               }, [
                  div({className: 'row'}, [
                     div({className: 'col-12'}, [
                        div({className: 'form-group'}, [
                           div({className: 'row'}, [
                              input({className: "form-control", name: "name", type:"text", placeholder:"Name on card", "aria-label":"Name on card"}),
                           ]),
                        ]),
                        div({className: 'form-group'}, [
                           div({ className: 'row' }, [
                              div({className: 'form-control', style:{height: 55}}, [
                                 div({
                                    id:"card-element", "aria-label":"Credit or debit card", style: {color: "#fff"},
                                    ref: card => {
                                       if(card){ 
                                          this.card = card;
                                       }
                                    }
                                 }),
                              ]),
                           ])
                        ]),
                        div({className: 'form-group'}, [
                           div({className: 'row'}, [
                              button({className: "btn btn-primary btn-block", type:"submit"}, [
                                 span({className: "fas fa-lock mr-2"}),
                                 span("Pay $25")
                              ]),
                           ]),
                        ]),
                        div({className: 'form-group'}, [
                           div({className: 'row'}, [
                              div({ role: "alert", ref: messageContainter => this.messageContainter = messageContainter }, [
                                 
                              ])
                           ]),
                        ]),
                     ]),
                     div({id: "payment-request-button"}),
                     div({className: 'col-12 text-center'}, [
                        span({className: "fab fa-stripe fa-5x"})
                     ]),
                  ])
               ])
            ])
         ]),
      ]);
   }

   componentDidUpdate() {
      super.componentDidUpdate();
      const theme = localStorage.getItem('skin');
      if (this.theme === theme) return;
      this.theme = theme;

      this.stripeElementsList.card?.update({style: {
         base: {
            color: theme === "dark" ? '#fff' : '#000',
            iconColor: theme === "dark" ? '#fff' : '#000',
            '::placeholder': {
               color: theme === "dark" ? '' : '#42425da9',
            },
         }
      }});
   }

   addMessage(message) {
      this.messageContainter.node.style.display = "block";
      this.messageContainter.node.innerHTML += '>' + message + '<br>';
   }

   async makeStripeComponent() {
      if (!this.card.node || this.completeComponent || this.props.designer) return;
      this.completeComponent = true;
      this.theme = localStorage.getItem('skin');
      const key = "pk_test_51NK8ILAxg5LsnkU6R3Q7gsH2lEFxQpNr4TkIjebYgbnAOVwHphL7mtT7aUWYA8v40EMVE3ihTE5XK0nLVx90fKvg00LN8ONS2m"
      this.stripe = Stripe(key);
      this.stripe_elements = this.stripe.elements();

      const base = {
         color: theme === "dark" ? '#fff' : '#000',
         iconColor: theme === "dark" ? '#fff' : '#000',
         '::placeholder': {
            color: theme === "dark" ? '' : '#42425da9',
         },
      }

      this.stripeElementsList["card"] = this.stripe_elements.create('card', {
         hidePostalCode: true,
         style: {
            base: {
               iconColor: 'white',
               color: 'white',
               backGroundColor: '#2d2d3f',
               lineHeight: '40px',
               fontWeight: 300,
               fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
               fontSize: '15px',

               '::placeholder': {
                  //color: '#42425da9',
               },
               ...base
            },
         }
      });

      this.stripeElementsList.card.mount(this.card.node);

      this.form.node.addEventListener('submit', async (event) => {
         event.preventDefault();

         const { message: stripeData } = await loopar.method("Stripe", "clientSecret");
         const clientSecret = stripeData.client_secret;

         const nameIput = this.form.node.querySelector('input[name="name"]');
         const {error: stripeError, paymentIntent} = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: {
               card: this.stripeElementsList.card,
               billing_details: {
                  name: nameIput.value,
               },
            }
         });

         if(stripeError) {
            loopar.dialog({
               title: "Error",
               type: "error",
               content: stripeError.message,
            });
            return;
         }else{
            loopar.dialog({
               title: "Success",
               type: "success",
               content: "Payment success",
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

export const StripeComponent = (props) => {
   return React.createElement(StripeClass, props);
}