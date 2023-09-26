import { h1, a, h6, i, span, div, li, ul, p} from "../elements.js";
import Component from "../base/component.js";
import { loopar } from "/loopar.js";
import { Pagination } from "/components/common/pagination.js";

export default class DocumentHistoryClass extends Component {
   blockComponent = true;
   className = "card card-fluid";

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         collapsed: this.getStatusCollapsable(),
         history: [],
      }
   }

   async getHistory() {
      const data = await loopar.method("Document History", "history", {
         documentName: this.props.document, 
         documentId: this.props.document_id,
         page: this.currentPage || 1
      });

      this.setState({
         history: data.meta.rows,
         pagination: data.meta.pagination
      });
   }

   async search() {
      await this.getHistory();
   }

   get pagination() {
      return this.state.pagination || {};
   }

   componentDidMount() {
      this.getHistory();
   }

   setPage(page) {
      this.currentPage = page;
      this.search();
   }

   render() {
      const data = {
         label: "History"
      };

      return super.render([
         div({ className: 'card-header' },
            h6(
               a({
                  className: "btn btn-reset",
                  onClick: () => {
                     this.toggleHide();
                  }
               }, [
                  span({ lassName: 'mr-2' },
                     data.label
                  ),
                  span({ className: 'collapse-icon ml-2' },
                     i({
                        className: `fas fa-chevron-${this.state.collapsed ? "down" : "up"}`,
                        onClick: () => {
                           this.toggleHide();
                        }
                     })
                  )
               ])
            )
         ),
         div({
            Component: this,
            ref: el => this.container = el,
            className: "card-body collapse show element sub-element" + (this.props.bodyClassName || ""),
            style: this.state.collapsed ? { display: "none" } : {}
         }, [
            ul({ className: "timeline" }, [
               this.state.history.map((row, key) => {
                  //console.log(row);
                  const icon = row.action === "Created" ? "fa-plus" : row.action === "Updated" ? "fa-edit" : "fa-trash";
                  return li({ className: "timeline-item" }, [
                     div({ className: "timeline-figure" }, [
                        span({ className: "tile tile-circle tile-sm" }, [
                           i({ className: `fa ${icon} fa-lg` })
                        ])
                     ]),
                     div({ className: "timeline-body" }, [
                        div({ className: "media" }, [
                           div({ className: "media-body" }, [
                              h6({ className: "timeline-heading" }, [
                                 a({ href: "#", className: "text-link" }, [
                                    row.user
                                 ]),
                                 " " + row.action
                              ]),
                              /*p({ className: "mb-0" }, [
                                 a({ href: "#" }, [
                                    row.date
                                 ])
                              ]),*/
                              p({ className: "timeline-date d-sm-none" }, [
                                 row.date
                              ])
                           ]),
                           div({ className: "d-sm-block" }, [
                              span({ className: "timeline-date" }, [
                                 row.date
                              ])
                           ])
                        ])
                     ])
                  ])
               })
            ]),
            Pagination({
               pagination: this.pagination,
               app: this
            })
         ])
      ]);
   }

   getStatusCollapsable() {
      const {document, document_id} = this.props;
      const collapsed = localStorage.getItem(`${document}${document_id}`);
      return collapsed === null ? true : collapsed === "true";
   }

   toggleHide() {
      const {document, document_id} = this.props;
      const collapsed = this.getStatusCollapsable();

      localStorage.setItem(`${document}${document_id}`, !collapsed);

      this.setState({
         collapsed: !collapsed
      });
   }
}

export const DocumentHistory = (props) => {
   return React.createElement(DocumentHistoryClass, props);
}