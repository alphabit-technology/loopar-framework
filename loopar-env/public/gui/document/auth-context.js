
import {Element, div} from "/components/elements.js";
import BaseForm from "./base/base-form.js";
import {element_manage} from "/components/element-manage.js";

export default class AuthContext extends BaseForm {
   constructor(props) {
      super(props);
   }

   render(content=[]) {
      return super.render([
         ...this.props.meta.__DOCTYPE__.STRUCTURE.map(el => {
            return Element(el.element,
               {
                  formRef: this,
                  docRef: this,
                  key: element_manage.getUniqueKey(),
                  meta: {
                     ...el,
                  },
                  ref: self => {
                     if (self) {
                        /*For inputs and other elements that have a name and have */
                        if (self.is_writable && el.data.name) {
                           this.form_fields[el.data.name] = self;
                        }
                     }
                  }
               }
            )
         })
      ]);
   }
}