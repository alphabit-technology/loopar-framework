import { Element, div } from "/components/elements.js";
import BaseForm from "./base/base-form.js";
import { loopar } from "/loopar.js";


export default class InstallerContext extends BaseForm {
   notRequireChanges = true;
   constructor(options) {
      super(options);
   }

   render(content = []) {
      return super.render([
         ...this.props.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element,
               {
                  docRef: this,
                  meta: {
                     ...el,
                  },
                  //...(el.data.action ? {onClick: () => this.send({action: el.data.action})} : {}),
               }
            )
         })
      ]);
   }

   /*render(content=[]) {
      return super.render([
         ...super.__CONTENT__(content)
      ]);
   }*/

   /*make(){
      super.make();
      this.render();
   }

   render() {
      super.render();
   }*/

   async install() {
      await this.send({ action: "install" });
   }

   async connect() {
      await this.send({ action: "connect" });
   }
}