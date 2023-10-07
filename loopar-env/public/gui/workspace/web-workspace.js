import { div, span, button, ul, li, a, image, section, hr, h5, p } from "/components/elements.js";
import BaseWorkspace from "./base/base-workspace.js";
import { loopar } from "../../loopar.js";
import { StripeComponent } from "../../components/elements/stripe.js";
import { fileManager } from "../../components/tools/file-manager.js";

export default class WebWorkspace extends BaseWorkspace {
   headerHeight = 90;
   constructor(props) {
      super(props);
   }

   render() {
      const data = this.props.meta || {};
      const webApp = data.web_app.__DOCUMENT__;
      const menuData = webApp.menu_items;
      const menuItems = menuData.rows;

      const user = data.user;
      const logo = fileManager.getImage(webApp, "logo");
      const logo_width = parseInt(webApp.logo_width || 50);
      const theme = window.theme// === "dark" ? "light" : "dark";

      const coverStyle = {
         position: webApp.fixed ? "fixed" : "unset",
         display: webApp.fixed ? "block" : "none",
         width: "100%",
         height: 90,
         zIndex: "9999999",
         backgroundColor: theme === 'dark' ? 'var(--light)' : 'var(--primary)',// webApp.opacity ? "var(--light)" : "transparent",
         opacity: webApp.opacity || 1,
      };

      const menuStyle = {
         position: webApp.fixed ? "fixed" : "unset",
         width: "100%",
         zIndex: "9999999",
      };

      

      return super.render([
         /*div({className: "toast-bottom-left", id: "toast-container", style: {position: "fixed", bottom: "0px", left: "0px", right: "0px", zIndex: 999999}},
            this.notifies,
         ),*/
         div({style: coverStyle }),
         div({ className: `navbar navbar-expand-lg navbar-${theme === 'dark' ? 'light' : 'dark'} py-4 aos-init aos-animate`, style: menuStyle }, [
            div({ className: "container" }, [
               button({ 
                  className: `hamburger hamburger-squeeze ---hamburger-light d-flex d-lg-none`, 
                  type: "button", "data-toggle": "collapse", "data-target": "#navbarNavDropdown", "aria-controls": "navbarNavDropdown", "aria-expanded": "false", "aria-label": "Toggle navigation" 
               }, [
                  span({ className: "hamburger-box" }, [
                     span({ className: "hamburger-inner" })
                  ])
               ]),
               a({ className: "navbar-brand ml-auto mr-0",/* style: { position: "absolute" } */}, [
                  image({ src: logo, alt: "Logo", className: "img-fluid", width: logo_width })
               ]),
               div({ className: "ml-auto order-lg-2" }, [
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
                  user ? a({ className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2", href: "/desk", redirect: true }, "Desk") :
                     a({ className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2", href: "/auth/login/login", redirect: true }, "Login"),
                  a({
                     className: "navbar-btn btn btn-subtle-secondary ml-auto order-lg-2", 
                     onClick: () => {
                        loopar.toggleTheme(true);
                        this.setState({});
                     }
                  }, [
                     span({ className: `oi oi-${window.theme === "dark" ? "sun" : "moon"}` })
                  ]),
                  /*a({
                     className: "navbar-btn btn btn-subtle-secondary ml-auto order-lg-2 d-lg-none",
                     type: "button", "data-toggle": "collapse", "data-target": "#navbarNavDropdown", "aria-controls": "navbarNavDropdown", "aria-expanded": "false", "aria-label": "Toggle navigation"
                  }, [
                     span({ className: `oi oi-menu` }),
                  ]),*/
                  /*button({ className: "navbar-btn btn btn-subtle-secondary ml-auto order-lg-2 d-lg-none", type: "button", "data-toggle": "collapse", "data-target": "#navbarNavDropdown", "aria-controls": "navbarNavDropdown", "aria-expanded": "false", "aria-label": "Toggle navigation" }, [
                     span({ className: "hamburger-box" }, [
                        span({ className: "hamburger-inner" })
                     ])
                  ]),*/
               ]),
               
               div({ 
                  className: "collapse navbar-collapse pl-3", id: "navbarNavDropdown"/*, style: { marginLeft: logo_width }*/ 
               }, [
                  ul({ className: "navbar-nav" }, [
                     menuItems.map((item) => {
                        const active = item.menu_link === loopar.currentPageName;
                        return li({ className: `nav-item mr-lg-2 ${active ? "active" : ""}`, ref: self => this[item.menu_link] = self }, [
                           a({
                              className: "nav-link py-2", href: "#", onClick: () => {
                                 this.navigate(item.menu_link);
                              }
                           }, item.menu_link)
                        ]);
                     })
                  ])
               ])
            ])
         ]),
         ...super.documents,
         section({ className: "py-5 bg-black", ref: footer => this.footer = footer }, [
            webApp.has_footer ? div({ className: "container" }, [
               React.createElement("div", this.innerHtml(marked.parse(webApp.footer || ""))),
            ]) : null,
            webApp.has_copyright ? div({ className: "container container-fluid-xl" }, [
               hr({ className: "my-4" }),
               React.createElement("div", this.innerHtml(marked.parse(webApp.copyright || "")))
            ]) : null,
         ])
      ]);
   }

   componentDidMount(prevProps, prevState, snapshot) {
      super.componentDidMount(prevProps, prevState, snapshot);

      AOS.init();
      Object.values(this.footer.node.getElementsByTagName("a")).forEach(a => {
         a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.navigate(a.href.split("/").pop());
         });
      });
   }

   navigate(url) {
      loopar.navigate(url);
      loopar.currentPageName = url;
      this.setState({});
   }
}