/*import { DeskGUI } from "./base/desk-gui.js";
import { Element } from "/components/elements.js";
import BaseForm from "./base/base-form.js";
import { elementManage } from "../../components/element-manage.js";*/
//import { json } from "body-parser";

/*export default class FormContext extends BaseForm {
   canUpdate = true;
   hasSidebar = true;
   hasHeader = true;
   hasHistory = true;

   constructor(props) {
      super(props);
   }

   render(content) {
      if (content) return content;
      const meta = this.props.meta;

      return super.render([
         DeskGUI({
            docRef: this,
            ref: gui => {
               gui && (this.gui = gui);
            },
         }, [
            ...meta.__DOCTYPE__.STRUCTURE.map(el => {
               const e = el.element;
               if (el.data.hidden) return null;
               //el.data.id ??= el.data.id || el.data.name;
               //el.data.key ??= elementManage.getUniqueKey();

               return Element(e, {
                  ...(e === "designer" ? { fieldDesigner: true } : {}),
                  designer: e === "designer",
                  droppable: e === "designer",
                  docRef: this,
                  key: meta.key + "_" + el.data.id,
                  meta: {
                     ...el,
                     element: e,
                  },
                  readOnly: this.readOnly,
                  ref: self => {
                     if (self) {
                        if (el.data.name) {
                           if (self.isWritable)
                              this.formFields[el.data.name] = self;
                           else
                              this[el.data.name] = self;
                        }
                     }
                  }
               })
            })
         ])
      ]);
   }

   get sidebarContent() {
      return null
   }

   get sidebarHeaderContent() {
      return null
   }
}*/