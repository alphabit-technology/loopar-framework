import { div, span, button, ul, li, a, image, section, hr, h5, p, aside, header, nav, h6 } from "/components/elements.js";
import BaseWorkspace from "./base/base-workspace.js";
import { loopar } from "../../loopar.js";
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
      const logoWidth = parseInt(webApp.logoWidth || 50);
      const theme = window.theme// === "dark" ? "light" : "dark";

      const coverStyle = {
         position: webApp.fixed ? "fixed" : "unset",
         display: webApp.fixed ? "block" : "none",
         width: "100%",
         height: 90,
         zIndex: "9999999",
         //backgroundColor: theme === 'dark' ? 'var(--light)' : 'var(--primary)',// webApp.opacity ? "var(--light)" : "transparent",
         opacity: webApp.opacity || 1,
      };

      const menuStyle = {
         position: webApp.fixed ? "fixed" : "unset",
         width: "100%",
         zIndex: "9999999",
      };

      const { menu, collapseMenu, mobileMenuUser, width } = this.state;
      //onst user = this.meta.user || {};
      const profileImage = fileManager.getImage(user, "profile_picture", "profile.png");
      

      return super.render([
         /*div({className: "toast-bottom-left", id: "toast-container", style: {position: "fixed", bottom: "0px", left: "0px", right: "0px", zIndex: 999999}},
            this.notifies,
         ),*/
         div({className: "bg-light", style: coverStyle }),
         div({ 
            className: "page-sidebar sidebar-toggler d-lg-none collapse", "data-sidebar": "page-sidebar", 
            style: {top: 0, zIndex: 99999999999999, opacity: 0.9}
         }, [
            div({ className: "sidebar-content", style: { height: "calc(100vh - 90px)" } }, [
               button({
                  className: `btn btn-subtle-secondary hamburger-squeeze ---hamburger-light ml-auto mt-2 mr-2`,
                  type: "button", 
                  "data-toggle": "collapse", "data-attr": "data-sidebar", "data-target": "page-sidebar",
                  "aria-controls": "navbarNavDropdown", "aria-expanded": "true", "aria-label": "Toggle navigation",
                  style: { float: "right", position: "relative", zIndex: 99999999999999}
               }, [
                  span({ className: "hamburger-box" }, [
                     span({ className: "hamburger-inner custom" })
                  ])
               ]),
               nav({ className: "stacked-menu" }, [
                  ul({ className: "menu" }, [
                     menuItems.map((item) => {
                        const active = item.menu_link === loopar.currentPageName;
                        return li({ className: `menu-item ${active ? "active" : ""}`, ref: self => this[item.menu_link] = self }, [
                           a({
                              className: "menu-link py-2", href: "#",
                              onClick: (e) => {
                                 this.navigate(item.menu_link);
                                 this.toggleSidebar(e);
                              }
                           }, item.menu_link)
                        ]);
                     })
                  ])
               ])
            ])
         ]),
         
         div({ className: `navbar navbar-expand-lg navbar-${theme === 'dark' ? 'light' : 'dark'} py-4 aos-init aos-animate`, style: menuStyle }, [
            div({ className: "container" }, [
               a({ className: "navbar-brand ml-auto mr-0", style: { position: "absolute" }}, [
                  image({ src: logo, alt: "Logo", className: "img-fluid", width: logoWidth })
               ]),
               div({ className: "ml-auto order-lg-1" }, [
                  /*StripeComponent({
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
                  }),*/
                  /*webApp.stripe_link_donation ?
                  a({
                     className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2 mr-1",
                     href: webApp.stripe_link_donation,
                  }, [
                     "Donate",
                  ]) : null,*/
                  //https://buy.stripe.com/test_bIY9CnaHu4ee7dK7ss
                  webApp.login_button ? [ 
                     user ? a({ className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2", href: "/desk", redirect: true }, "Desk") :
                     a({ className: "navbar-btn btn btn-subtle-success ml-auto order-lg-2", href: "/auth/login/login", redirect: true }, "Login"),
                  ] : null,
                  a({
                     className: "navbar-btn btn btn-subtle-secondary ml-auto order-lg-2", 
                     onClick: () => {
                        loopar.toggleTheme(true);
                        this.setState({});
                     }
                  }, [
                     span({ className: `oi oi-${window.theme === "dark" ? "sun" : "moon"} text-dark` })
                  ]),
                  button({
                     className: `navbar-btn  btn btn-subtle-secondary hamburger-squeeze ---hamburger-light ml-auto order-lg-2 d-lg-none`,
                     type: "button",
                     "data-toggle": "collapse", "data-attr": "data-sidebar", "data-target": "page-sidebar",
                     //"data-toggle": "collapse", "data-target": "#page-sidebar",
                     "aria-controls": "navbarNavDropdown", "aria-expanded": "false", "aria-label": "Toggle navigation"
                  }, [
                     span({ className: "hamburger-box" }, [
                        span({ className: "hamburger-inner custom" })
                     ])
                  ]),
               ]),
               div({ 
                  className: "collapse navbar-collapse", id: "navbarNavDropdown", style: { marginLeft: logoWidth }
               }, [
                  ul({ className: "navbar-nav" }, [
                     menuItems.map((item) => {
                        const active = item.menu_link === loopar.currentPageName;
                        return li({ className: `nav-item mr-lg-2 ${active ? "active" : ""}`, ref: self => this[item.menu_link] = self }, [
                           a({
                              className: "nav-link py-2 text-dark", 
                              href: "#", 
                              onClick: (e) => {
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