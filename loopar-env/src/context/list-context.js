/*import { ListGrid } from "/components/elements/form-table.js";
import BaseDocument from "./base/base-document.js";
import { DeskGUI } from "./base/desk-gui.js";
import { button, span } from "/components/elements.js";*/

/*export default class ListContext extends BaseDocument {
   hasHeader = true;
   hasSidebar = true;
   context = 'index';
   renderStructure = false;

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         viewType: localStorage.getItem(props.meta.__DOCTYPE__.name + "_viewType") || props.meta.__DOCTYPE__.default_list_view || "List"
      };
   }

 
   get viewType() {
      return this.onlyGrid === true ? "Grid" : this.state.viewType;
   }

   setCustomActions() {
      super.setCustomActions();
      this.setCustomAction('view_tipe', [
         this.onlyGrid !== true ? button({
            className: 'btn btn-secondary', onClick: () => {
               const viewType = this.viewType === 'List' ? 'Grid' : 'List';
               localStorage.setItem(this.props.meta.__DOCTYPE__.name + "_viewType", viewType);
               this.setState({ viewType });
            }
         }, [
            span({ className: this.viewType === 'List' ? 'oi oi-grid-three-up' : 'oi oi-list' }),
         ]) : null
      ])
   }

   render(content) {
      content = [
         content,
         !content || this.renderGrid ? ListGrid({
            meta: this.props.meta,
            viewType: this.viewType,
            docRef: this,
            ref: (grid) => {
               this.grid = grid;
            }
         }) : null
      ];

      return super.render([
         this.props.modal ? content :
         DeskGUI({
            docRef: this
         }, content)
      ]);
   }

   componentDidMount() {
      super.componentDidMount();
      this.setCustomActions();
   }
}*/