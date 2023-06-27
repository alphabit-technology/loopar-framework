import {Element, div} from "/components/elements.js";
import BaseForm from "./base/base-form.js";


export default class InstallerContext extends BaseForm {
   constructor(options) {
      super(options);
   }

   render(content=[]) {
      return super.render([
         ...this.props.meta.__DOCTYPE__.STRUCTURE.map(el => {
            return Element(el.element,
               {
                  formRef: this,
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
      console.log("install");
      await this.send({action: "install"});
   }

   async connect() {
      console.log("connect");
      await this.send({action: "connect"});
   }
}