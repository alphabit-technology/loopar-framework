import { DeskGUI } from "./base/desk-gui.js";
import { Element } from "/components/elements.js";
import BaseForm from "./base/base-form.js";

export default class FormContext extends BaseForm {
   constructor(props) {
      super(props);
   }

   render(content) {
      if (content) return content;
      const meta = this.props.meta;

      console.log("FormContext", meta);
      return super.render([
         DeskGUI({
            meta: meta,
            hasSidebar: true,
            has_header: true,
            ref: gui => this.gui = gui,
            sidebarHeaderContent: this.sidebarHeaderContent,
            sidebarContent: this.sidebarContent,
            docRef: this,
            formRef: this
         }, [
            ...meta.__DOCTYPE__.STRUCTURE.map(el => {
               const e = el.element;
               return Element(e, {
                  ...(e === "designer" ? { fieldDesigner: true } : {}),
                  designer: e === "designer",
                  droppable: e === "designer",
                  formRef: this,
                  docRef: this,
                  key: meta.key + "_" + el.data.name,
                  meta: {
                     ...el,
                     element: e,
                  },
                  ref: self => {
                     if (self) {
                        /*For inputs and other elements that have a name and have */
                        if (el.data.name) {
                           if (self.is_writable)
                              this.form_fields[el.data.name] = self;
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
}