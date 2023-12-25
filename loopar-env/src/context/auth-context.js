
/*import { Element, div } from "/components/elements.js";
import BaseForm from "./base/base-form.js";
import { elementManage } from "/components/element-manage.js";*/

/*export default class AuthContext extends BaseForm {
   constructor(props) {
      super(props);
   }

   render(content = []) {
      return super.render([
         ...this.props.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element,
               {
                  docRef: this,
                  key: elementManage.getUniqueKey(),
                  meta: {
                     ...el,
                  },
                  ref: self => {
                     if (self) {
                        if (self.isWritable && el.data.name) {
                           this.formFields[el.data.name] = self;
                        }
                     }
                  }
               }
            )
         })
      ]);
   }
}*/