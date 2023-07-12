import {DeskSidebar} from "../../components/layout/desk-sidebar.js"
import {TopBar} from "../../components/layout/top-bar.js";
import {div, aside, nav, main, header, button, span, image, a} from "../../components/elements.js";
import {http} from "/router/http.js";
import BaseWorkspace from "./base/base-workspace.js";
import {fileManager} from "../../components/tools/file-manager.js";

export default class DeskWorkspace extends BaseWorkspace {
   constructor(props){
      super(props);
   }

   resize(){
      super.resize();
      this.bodyToggleMenu();
   }

   render(){
      const {menu, collapse_menu, mobile_menu_user, width} = this.state;
      const user = this.meta.user || {};
      const profile_image = fileManager.getImage(user, "profile_picture", "profile.png");

      return super.render([
         header({className: 'app-header app-header-dark'}, [
            TopBar({user: user, refresh: this.refresh.bind(this), width})
         ]),
         aside({className: `app-aside app-aside-expand-md app-aside-light ${menu ? 'show' : ''}`, id:"aside"}, [
            div({className: 'aside-content'}, [
               header({className: "aside-header b-block d-md-none"}, [
                  button({className: "btn-account", onClick: () => this.setState({mobile_menu_user: !mobile_menu_user})}, [
                     span({className: "user-avatar user-avatar-lg"}, [
                        image({ src: profile_image, alt: "Profile Picture" })
                     ]),
                     span({className: "account-icon"}, [
                        span({className: "fa fa-caret-down fa-lg"})
                     ]),
                     span({className: "account-summary"}, [
                        span({className: "account-name"}, [
                           user.name
                        ]),
                        span({className: "account-description"}, [
                           user.role
                        ])
                     ])
                  ]),
                  div({id: "dropdown-aside", className: `dropdown-aside collapse ${mobile_menu_user ? "show": ""}`, style: {}}, [
                     div({className: "pb-3"}, [
                        a({className: "dropdown-item", href: "/auth/user/profile"}, [
                           span({className: "dropdown-icon oi oi-person"}),
                           "Profile"
                        ]),
                        a({className: "dropdown-item", href: "/auth/user/logout"}, [
                           span({className: "dropdown-icon oi oi-account-logout"}),
                           "Logout"
                        ]),
                        /*div({className: "dropdown-divider"}),
                        a({className: "dropdown-item", href: "#"}, "Help Center"),
                        a({className: "dropdown-item", href: "#"}, "Ask Forum"),
                        a({className: "dropdown-item", href: "#"}, "Keyboard Shortcuts"),*/
                     ])
                  ])
               ]),
               div({className: 'aside-menu overflow-hidden ps'}, [
                  nav({
                     className: `stacked-menu ${collapse_menu ? "stacked-menu-has-compact stacked-menu-has-hoverable" : "stacked-menu-has-collapsible"}`,
                  }, [
                     DeskSidebar({
                        meta: this.props.meta,
                        ref: sidebar => this.sidebar = sidebar,
                     })
                  ])
               ]),
               /*footer({className: 'aside-footer border-top p-2'}, [
                  button({
                     className: 'btn btn-light btn-block text-primary',
                     onClick: () => {
                        loopar.toggle_skin();
                     }
                  }, [
                     span({className: 'd-compact-menu-none'}, [
                        "Night Mode",
                        i({className: 'fas fa-moon ml-1'})
                     ])
                  ])
               ])*/
            ])
         ]),
         main({className: 'app-main'}, [
            div({className: 'wrapper'}, [
               super.documents,
               //...this.props.children
            ])
         ]),
         div({className: `aside-backdrop ${this.state.show_backdrop ? 'show' : ''}`, style: {display: this.state.show_backdrop ? 'block' : 'none'}, onClick: () => {
            this.toggleMenu();
         }})
      ]);
   }

   toggleMenu(){
      const menu = this.state.menu;
      this.setState({menu: !menu, show_backdrop: !menu, collapse_menu: false});
   }

   bodyToggleMenu(){
      const has_compact_menu = window.innerWidth > 768;
      document.getElementById("app-root")?.classList[this.state.collapse_menu && has_compact_menu ? "add" : "remove"]("has-compact-menu");
   }

   collapseMenu(){
      const collapse_menu = !this.state.collapse_menu;
      this.setState({menu: false, show_backdrop: false,  collapse_menu: collapse_menu});
      localStorage.setItem("collapse_menu", collapse_menu);
   }

   componentDidUpdate(){
      super.componentDidUpdate();
      this.bodyToggleMenu();
   }

   componentDidMount(){
      super.componentDidMount();
      this.bodyToggleMenu();
   }

   async refresh(){
      return new Promise(resolve => {
         http.send({
            action: "/api/desk/sidebar",
            params: {},
            success: r => {
               this.state.meta.menu_data = r.meta.sidebarData;
               //this.setState({meta: this.state.meta});
               resolve(r);
            }
         });
      });
   }
}