import {ListGrid} from "/components/elements/form-table.js";
import BaseDocument from "./base/base-document.js";
import {DeskGUI} from "./base/desk-gui.js";

export default class ListContext extends BaseDocument {
   has_header = true;
   context = 'index';
   render_structure = false;

   constructor(options) {
      super(options);
   }

   /*set_data(data) {
      super.set_data(data);
      this.grid.setState({data: {meta: data}});
   }*/

   render(content){
      return super.render([
         DeskGUI({
            meta: this.props.meta,
            ref: gui => this.gui = gui,
            has_sidebar: true,
            has_header: this.has_header,
            base: this
         }, [
            content || ListGrid({meta: this.props.meta, ref: (self) => this.grid = self})
         ])
      ]);
   }
}