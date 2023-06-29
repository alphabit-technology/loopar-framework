import {div} from "/components/elements.js";
import {Header} from "/components/layout/header.js";

class DeskGUIClass extends React.Component {
   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         sidebar_open: false
      }
   }

   render() {
      const {sidebar_open} = this.state;
      return [
         div({className: `page has-sidebar has-sidebar-open ${sidebar_open ? " has-sidebar-expand-xl has-sidebar-open" : ""}`}, [
            div({className: `page-inner page-inner-fill`, style: {marginRight: "unset"}}, [
               div({className: 'message'}, [
                  (this.props.has_header) ? div({className: 'message-header', style: {width: "200%"}}, [
                     Header({
                        has_sidebar: this.props.has_sidebar,
                        meta: this.props.meta,
                        gui: this,
                        docRef: this.props.docRef,
                        formRef: this.props.formRef,
                     }),
                  ]) : null,
                  div({className: 'message-body'}, [
                     this.props.children
                  ])
               ])
            ]),
            this.props.has_sidebar ?
               div({
                  className: `page-sidebar sidebar-dar-primary ${sidebar_open ? '' : 'd-none'}`,
                  style: {position: "absolute", transition: "unset"},
                  ref: (self) => this.sidebar = self
               }, [
                  div({className: "nav nav-tabs nav-fill"}, [
                     this.props.sidebarHeaderContent
                  ]),
                  div({className: "sidebar-section-fill"}, [
                     this.props.sidebarContent
                  ])
               ])
               : null
         ])
      ];
   }

   toggleSidebar(show = null) {
      this.setState({sidebar_open: show !== null ? show : !this.state.sidebar_open});
   }
}

export const DeskGUI = (props, content) => {
   return React.createElement(DeskGUIClass, props, content);
}
