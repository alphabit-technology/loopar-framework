import { div } from "/components/elements.js";
import { Header } from "/components/layout/header.js";
import { DocumentHistory } from "/components/elements/document-history.js";

class DeskGUIClass extends React.Component {
   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         sidebarOpen: false
      }
   }

   get docRef() {
      return this.props.docRef;
   }

   get meta() {
      return this.docRef.props.meta;
   } 

   render() {
      const { sidebarOpen } = this.state;
      console.log("render desk gui")
      return [
         div({ className: `page has-sidebar has-sidebar-open ${sidebarOpen ? " has-sidebar-expand-xl has-sidebar-open" : ""}` }, [
            div({ className: `page-inner page-inner-fill`}, [
               div({ className: 'message' }, [
                  (this.docRef.hasHeader) ? div({ className: 'message-header', style: { width: "200%" } }, [
                     Header({
                        gui: this
                     }),
                  ]) : null,
                  div({ className: 'message-body' }, [
                     this.props.children,
                     this.docRef.hasHistory ? DocumentHistory({
                        document: this.meta.__DOCTYPE__.name,
                        document_id: this.meta.__DOCUMENT__.id
                     }) : null
                  ])
               ]),

            ]),
            this.docRef.hasSidebar ?
               div({
                  className: `page-sidebar sidebar-dar-primary ${sidebarOpen ? '' : 'd-none'}`,
                  style: { position: "absolute", transition: "unset" },
                  ref: (self) => this.sidebar = self
               }, [
                  div({ className: "nav nav-tabs nav-fill" }, [
                     this.docRef.sidebarHeaderContent
                  ]),
                  div({ className: "sidebar-section-fill" }, [
                     this.docRef.sidebarContent
                  ])
               ])
               : null
         ])
      ];
   }

   toggleSidebar(show = null) {
      this.setState({ sidebarOpen: show !== null ? show : !this.state.sidebarOpen });
   }
}

export const DeskGUI = (props, content) => {
   return React.createElement(DeskGUIClass, props, content);
}
