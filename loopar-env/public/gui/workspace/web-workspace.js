import {div, span, button, ul, li, a, image, section, hr, h5, p} from "/components/elements.js";
import BaseWorkspace from "./base/base-workspace.js";
import {loopar} from "../../loopar.js";
import { StripeComponent } from "../../components/elements/stripe.js";
import { fileManager } from "../../components/tools/file-manager.js";

export default class WebWorkspace extends BaseWorkspace {
   headerHeight = 90;
   constructor(props){
      super(props);
   }

   render(){
      const data = this.props.meta || {};
      //const menu_data = data.menu_data.__DOCUMENT__;
      const web_app = data.web_app.__DOCUMENT__;
      console.log("web_app", web_app)
      const menu_data = web_app.menu_items;
      const menu_items = menu_data.rows;

      //const menu_items = menu_data.menu_items.rows;
      const user = data.user;
      const logo = fileManager.getImage(web_app, "logo");
      const logo_width = parseInt(web_app.logo_width || 60);

      const cover_style = {
         position: web_app.fixed ? "fixed" : "unset",
         display: web_app.fixed ? "block" : "none",
         width: "100%",
         height: 90,
         zIndex: "9999999",
         backgroundColor: web_app.opacity ? "var(--light)" : "transparent",
         opacity: web_app.opacity ? 0.7 : 1,
      };

      const menu_style = {
         position: web_app.fixed ? "fixed" : "unset",
         width: "100%",
         zIndex: "9999999",
      };

      return super.render([
         /*div({className: "toast-bottom-left", id: "toast-container", style: {position: "fixed", bottom: "0px", left: "0px", right: "0px", zIndex: 999999}},
            this.notifies,
         ),*/
         div({style: cover_style}),
         div({className: "navbar navbar-expand-lg navbar-light py-4 aos-init aos-animate", style: menu_style}, [
            div({className: "container"}, [
               button({className: "hamburger hamburger-squeeze hamburger-light d-flex d-lg-none", type: "button", "data-toggle": "collapse", "data-target": "#navbarNavDropdown", "aria-controls": "navbarNavDropdown", "aria-expanded": "false", "aria-label": "Toggle navigation"}, [
                  span({className: "hamburger-box"}, [
                     span({className: "hamburger-inner"})
                  ])
               ]),
               a({className: "navbar-brand ml-auto", style: {position: "absolute"}}, [
                  image({ src: logo, alt: "Logo", className: "img-fluid", width: logo_width})
               ]),
               div({className: "ml-auto order-lg-2"}, [
                  StripeComponent({
                     buttonClassName: "navbar-btn btn btn-subtle-success ml-auto order-lg-2 mr-1",
                     meta: {
                        data: {
                           label: "Donate",
                           amount: 2500,
                           currency: "usd",
                           description: "Payment for Loopar",
                           name: "Loopar",
                           image: "https://stripe.com/img/documentation/checkout/marketplace.png",
                           locale: "auto",
                           zipCode: true,
                           billingAddress: true,
                           panelLabel: "Pay {{amount}}",
                           allowRememberMe: true,
                           token: (token) => {
                              console.log(token);
                           }
                        }
                     }
                  }),
                  user ? a({className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2", href: "/desk", redirect: true}, "Desk") :
                     a({className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2", href: "/auth/login/login", redirect: true}, "Login"),

                  a({className: "navbar-btn btn btn-subtle-secondary ml-auto order-lg-2", onClick: () => {
                     loopar.toggle_theme(true);
                     this.setState({});
                  }}, span({className: `oi oi-${window.theme === "dark" ? "sun" : "moon"}`})),
               ]),
               div({className: "collapse navbar-collapse pl-3", id: "navbarNavDropdown", style: {marginLeft: logo_width}}, [
                  ul({className: "navbar-nav"}, [
                     menu_items.map((item) => {
                        const active = item.menu_link === loopar.current_page_name;
                        return li({className: `nav-item mr-lg-2 ${active ? "active" : ""}`, ref: self => this[item.menu_link] = self}, [
                           a({className: "nav-link py-2", href: "#", onClick: () => {
                              this.navigate(item.menu_link);
                           }}, item.menu_link)
                        ]);
                     })
                  ])
               ])
            ])
         ]),
         ...super.documents,
         section({className: "py-5 bg-black", ref: footer => this.footer = footer}, [
            web_app.has_footer ? div({className: "container"}, [
               React.createElement("div", this.innerHtml(marked.parse(web_app.footer || ""))),
            ]) : null,
            web_app.has_copyright ? div({className: "container container-fluid-xl"}, [
               hr({className: "my-4"}),
               React.createElement("div", this.innerHtml(marked.parse(web_app.copyright || "")))
            ]) : null,
         ])
      ]);
   }

   componentDidMount(){
      super.componentDidMount();
      AOS.init();
   }

   navigate(url){
      loopar.navigate(url);
      loopar.current_page_name = url;
      this.setState({});
   }

   make(){
      super.make();
      Object.values(this.footer.node.getElementsByTagName("a")).forEach(a => {
         a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.navigate(a.href.split("/").pop());
         });
      });
   }
}