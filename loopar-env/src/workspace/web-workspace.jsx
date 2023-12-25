
import React from "react";
import BaseWorkspace from "#workspace/base/base-workspace";
import loopar from "#loopar";
import fileManager from "#tools/file-manager";
import { marked } from 'marked';
import AOS from 'aos';
//import LooparHomeView from "#loopar-home-view";

export default class WebWorkspace extends BaseWorkspace {
   headerHeight = 90;
   constructor(props) {
      super(props);
   }

   /**render(){
      return super.render(
         <h1>Web Workspace</h1>
      )
   }*/

   render() {
      const data = this.props.meta || {};
      const webApp = data.web_app.__DOCUMENT__;
      const menuData = webApp.menu_items;
      const menuItems = menuData.rows;

      const user = data.user;
      const logo = fileManager.getImage(webApp, "logo");
      const logoWidth = parseInt(webApp.logoWidth || 50);
      const theme = global.getTheme()// === "dark" ? "light" : "dark";

      const coverStyle = {
         position: webApp.fixed ? "fixed" : "unset",
         display: webApp.fixed ? "block" : "none",
         width: "100%",
         height: 90,
         zIndex: "9999999",
         backgroundColor: loopar.utils.rgba(theme === 'dark' ? '#191927' : '#222230', webApp.opacity),// : `rgba(52, 108, 176, ${webApp.opacity || 1})`

         //backgroundColor: theme === 'dark' ? 'var(--light)' : 'var(--primary)',// webApp.opacity ? "var(--light)" : "transparent",
         //opacity: webApp.opacity || 1,
      };

      this.menuFixed = webApp.fixed;
      this.menuHeight = 90;

      const menuStyle = {
         position: webApp.fixed ? "fixed" : "unset",
         width: "100%",
         height: 90,
         zIndex: "9999999",
         backgroundColor: loopar.utils.rgba(theme === 'dark' ? '#191927' : '#222230', webApp.opacity)// `rgba(52, 108, 176, ${webApp.opacity || 1})`,
         //color: 'var(--dark)',
      };

      const { menu, collapseMenu, mobileMenuUser, width } = this.state;
      //onst user = this.meta.user || {};
      const profileImage = fileManager.getImage(user, "profile_picture", "profile.png");

      return super.render(
         <>
            <div
               className={`page-sidebar sidebar-toggler d-lg-none collapse`}
               data-sidebar="page-sidebar"
               style={{ top: 0, zIndex: 99999999999999, opacity: 0.9 }}
            >
               <div className="sidebar-content" style={{ height: "calc(100vh - 90px)" }}>
                  <button
                     className={`btn btn-subtle-secondary hamburger-squeeze ---hamburger-light ml-auto mt-2 mr-2`}
                     type="button"
                     data-toggle="collapse"
                     data-attr="data-sidebar"
                     data-target="page-sidebar"
                     aria-controls="navbarNavDropdown"
                     aria-expanded="true"
                     aria-label="Toggle navigation"
                     style={{ float: "right", position: "relative", zIndex: 99999999999999 }}
                  >
                     <span className="hamburger-box">
                        <span className="hamburger-inner custom" />
                     </span>
                  </button>
                  <nav className="stacked-menu">
                     {this.getMenuItems(menuItems)}
                  </nav>
               </div>
            </div>

            <div className={`navbar navbar-expand-lg navbar-${theme === 'dark' ? 'light' : 'dark'} py-4 aos-init aos-animate`} style={menuStyle}>
               <div className="container">
                  <a className="navbar-brand ml-auto mr-0" style={{ position: "absolute" }}>
                     <img
                        src={logo}
                        alt="Logo"
                        className="img-fluid"
                        width={logoWidth}
                        style={{ filter: "invert(1)", opacity: 0.9 }}
                     />
                  </a>
                  <div className="ml-auto order-lg-1">
                     {webApp.login_button ? [
                        user ? (
                           <a className="navbar-btn btn btn-subtle-success ml-auto order-lg-2" href="/desk" redirect>
                              Desk
                           </a>
                        ) : (
                           <a className="navbar-btn btn btn-subtle-success ml-auto order-lg-2" href="/auth/login/login" redirect>
                              Login
                           </a>
                        ),
                     ] : null}

                     <button
                        className="navbar-btn btn btn-subtle-secondary ml-auto order-lg-2"
                        onClick={() => {
                           loopar.toggleTheme(true);
                           this.setState({});
                        }}
                     >
                        <span className={`oi oi-${global.theme === "dark" ? "sun" : "moon"} text-${theme}`} />
                     </button>

                     <button
                        className={`navbar-btn  btn btn-subtle-secondary hamburger-squeeze ---hamburger-light ml-auto order-lg-2 d-lg-none`}
                        type="button"
                        data-toggle="collapse"
                        data-attr="data-sidebar"
                        data-target="page-sidebar"
                        aria-controls="navbarNavDropdown"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                     >
                        <span className="hamburger-box">
                           <span className="hamburger-inner custom" />
                        </span>
                     </button>
                  </div>
                  <div className="collapse navbar-collapse" id="navbarNavDropdown" style={{ marginLeft: logoWidth }}>
                     <ul className="navbar-nav">{menuItems.map((item) => (
                        <li className={`nav-item mr-lg-2 ${item.page === loopar.currentPageName ? "active" : ""}`} ref={self => this[item.page] = self}>
                           <a
                              className={`nav-link py-2 text-${theme}`}
                              href="#"
                              onClick={(e) => {
                                 this.navigate(item.link);
                              }}
                           >
                              {item.link}
                           </a>
                        </li>
                     ))}</ul>
                  </div>
               </div>
            </div>
            {super.documents}
            <section className="py-5 bg-black" ref={footer => this.footer = footer} style={{ position: "sticky", top: "100vh" }}>
               {webApp.has_footer ? (
                  <div className="container">
                     <div dangerouslySetInnerHTML={{ __html: marked.parse(webApp.footer || "") }} />
                  </div>
               ) : null}
               {webApp.has_copyright ? (
                  <div className="container container-fluid-xl">
                     <hr className="my-4" />
                     <div dangerouslySetInnerHTML={{ __html: marked.parse(webApp.copyright || "") }} />
                  </div>
               ) : null}
            </section>
         </>
      );

   }

   getMenuItems(menuItems) {
      return menuItems.map((item) => {
         const active = item.page === loopar.currentPageName;
         return (
            <ul className="menu">
               <li className={`menu-item ${active ? "active" : ""}`} ref={self => this[item.page] = self}>
                  <a
                     className={`menu-link py-2`}// text-${theme}`}
                     href="#"
                     onClick={(e) => {
                        this.navigate(item.page);
                     }}
                  >
                     {item.link}
                  </a>
               </li>
            </ul>
         )
      })
   }

   componentDidMount(prevProps, prevState, snapshot) {
      super.componentDidMount(prevProps, prevState, snapshot);

      AOS.init();
      /*Object.values(this.footer.node.getElementsByTagName("a")).forEach(a => {
         a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.navigate(a.href.split("/").pop());
         });
      });*/
   }

   navigate(url) {
      loopar.navigate(url);
      loopar.currentPageName = url;
      this.setState({});
   }
}