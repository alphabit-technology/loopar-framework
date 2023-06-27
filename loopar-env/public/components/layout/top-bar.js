import Div from "/components/elements/div.js";
import {a,span, ul, li, image, div, input, button, i, h6} from "/components/elements.js";
import {loopar} from "/loopar.js";
import { avatarLetter } from "../../tools/helper.js";
import { fileManager } from "../tools/file-manager.js";


class TopBarClass extends Div {
   className = "top-bar";
   constructor(props){
      super(props);
   }

   render(){
      const user = this.props.user || {};
      const dropdown_user_left = this.props.width > 991  ? 0 : -84;
      const profile_image = fileManager.getImage(user, "profile_picture");

      return [
         div({className: "top-bar border-bottom"}, [
            div({className: "top-bar-brand"}, [
               button({
                  className: "hamburger hamburger-squeeze mr-2 bg-danger",
                  type: "button",
                  onClick: () => loopar.root_app.collapseMenu()
               }, [
                  span({className: "hamburger-box"}, [
                     span({className: "hamburger-inner"})
                  ])
               ]),
               a({"href": "/core/Desk/view"}, [
                  image({
                     src: '/assets/images/logo.svg',
                     alt: "Loopar Logo",
                     style: {height: 28, width: 140},
                     href: "/core/Desk/view"
                  })
               ])
            ]),
            div({className: "top-bar-list"}, [
               div({className: "top-bar-item px-2 d-md-none d-lg-none d-xl-none"}, [
                  button({
                     className: "hamburger hamburger-squeeze",
                     type: "button",
                     onClick: () => loopar.root_app.toggleMenu()
                  }, [
                     span({className: "hamburger-box"}, [
                        span({className: "hamburger-inner"})
                     ])
                  ])
               ]),
               div({className: "top-bar-item top-bar-item-full"}, [
                  div({className: "top-bar-search"}, [
                     div({className: "input-group input-group-search dropdown"}, [
                        div({className: "input-group-prepend"}, [
                           span({className: "input-group-text"}, [
                              span({className: "oi oi-magnifying-glass"})
                           ])
                        ]),
                        input({
                           className: "form-control", type: "text", placeholder: "Search ...",
                           dataToggle: "dropdown", ariaLabel: "search"
                        }),
                        div({className: "dropdown-menu dropdown-menu-right"}, [
                           div({className: "dropdown-arrow"})
                        ])
                     ])
                  ])
               ]),
               div({className: "top-bar-item top-bar-item-right d-none d-sm-flex"}, [
                  ul({className: "header-nav nav"}, [
                     li({className: "nav-item has-notified"}, [
                        a({
                           className: "nav-link",
                           href: "#",
                           onClick: () => {
                              loopar.toggle_theme();
                              this.setState({})
                           }
                        }, [
                           span({className: `oi oi-${window.theme === "dark" ? "sun" : "moon"}`})
                        ]),
                     ]),
                     li({className: "nav-item dropdown header-nav-dropdown"}, [
                        a({
                           className: "nav-link",
                           href: "#",
                           onClick: () => "javascript:void(0);"
                        }, [
                           span({className: "oi oi-grid-three-up"})
                        ]),
                        div({
                           className: `dropdown-menu dropdown-menu-rich dropdown-menu-right`,
                           "x-out-of-boundaries": ""
                        }, [
                           div({className: "dropdown-arrow"}),
                           div({className: "dropdown-sheets"}, [
                              div({className: "dropdown-sheet-item"}, [
                                 a({className: "tile-wrapper", href: "/auth/user/list"}, [
                                    span({className: "tile tile-lg bg-cyan"}, [
                                       i({className: "oi oi-people"})
                                    ]),
                                    span({className: "tile-peek"}, "Users")
                                 ])
                              ]),
                              div({className: "dropdown-sheet-item"}, [
                                 a({className: "tile-wrapper", href: "/core/document/list"}, [
                                    span({className: "tile tile-lg bg-teal"}, [
                                       i({className: "oi oi-document"})
                                    ]),
                                    span({className: "tile-peek"}, "Documents")
                                 ])
                              ]),
                              div({className: "dropdown-sheet-item"}, [
                                 a({className: "tile-wrapper", href: "/developer"}, [
                                    span({className: "tile tile-lg bg-yellow"}, [
                                       i({className: "oi oi-fork"})
                                    ]),
                                    span({className: "tile-peek"}, "Developer")
                                 ])
                              ])
                           ])
                        ])
                     ]),
                  ]),
                  div({className: "dropdown d-md-flex"}, [
                     button({
                        className: "btn-account",
                        type: "button"
                     }, [
                        span({className: "user-avatar user-avatar-md"}, [
                           profile_image ? image({ src: profile_image, alt: "Profile Picture" }) : div({
                              className: "tile tile-circle bg-orange",
                              style: { display: "block" }
                           }, avatarLetter(user.name) || "")
                        ]),
                        span({className: "account-summary pr-lg-4 d-none d-lg-block"}, [
                           span({className: "account-name"}, user.name || "Loading..."),
                           span({className: "account-description"}, user.email || "Loading...")
                        ])
                     ]),
                     div({
                        className: `dropdown-menu`,
                        style: {position: "absolute", top: 56, width: '100%', left: dropdown_user_left, willChange: "top, left"}
                     }, [
                        //div({className: "dropdown-arrow d-lg-none"}),
                        //div({className: "dropdown-arrow ml-3 d-none d-lg-block"}),
                        h6({className: "dropdown-header d-none d-md-block d-lg-none"}, "John Doe"),
                        a({className: "dropdown-item", href: "/core/System%20Settings/update"}, [
                           span({className: "dropdown-icon oi oi-cog"}),
                           "System Settings"
                        ]),
                        a({className: "dropdown-item", href: "/auth/user/profile"}, [
                           span({className: "dropdown-icon oi oi-person"}),
                           "Profile"
                        ]),
                        a({className: "dropdown-item", href: "/auth/user/logout"}, [
                           span({className: "dropdown-icon oi oi-account-logout"}),
                           "Sign out"
                        ])
                     ])
                  ])
               ])
            ])
         ])
      ]
   }
}

export const TopBar = (props, content) => {
   return React.createElement(TopBarClass, props, content);
}