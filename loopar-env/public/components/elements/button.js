import Div from "/components/elements/div.js";

const buttons = {
   link: "link",
   info: "info",
   default: "default",
   primary: "primary",
   secondary: "secondary",
   success: "success"
}

export default class Button extends Div {
   className = "btn";
   constructor(props) {
      if (!props.designer) {
         props.tagName = "button";
      }

      super(props);
   }

   render() {
      const data = this.data;

      /***create function to Replace all classes that start with btn-***/
      if (this.className) {
         this.className = this.className.replace(/btn-[^ ]*/, "");
      }

      this.className += ` ${data.class || ''} btn btn-${buttons[data.type || 'primary']} ${data.size ? `btn-${data.size}` : ''}`;

      return super.render(data.label || "Button");
   }

   /*make() {
      super.make();
      const data = this.data;

      this.addClass(`${data.class || ''} btn ${buttons[data.type || 'primary']} ${data.size ? `btn-${data.size}` : ''}`);
   }*/

   /*make() {
      const label = this.content ? this.content.label || null : null;
      this.data.label = this.data.label || "Button";

      if (!label) {
         object_manage.assign(this, {
            content: {
               label: elements({content: this.data.label}).tag('span')
            }
         });
      }

      if (this.designer) {
         this.has_title = false;
         super.tag('div');
      } else {
         super.tag('a');
      }

      this.addClass('btn');
   }*/

   setType(type = 'default') {
      /*this.removeClass(`btn-${this.data.type}`).addClass(`btn-${type}`);
      this.data.type = type;

      return this;*/
   }

   setSize(size = 'md') {
      /*this.removeClass(`btn-${this.data.size}`).addClass(`btn-${size}`);
      this.data.size = size;

      return this;*/
   }
}

Object.keys(buttons).forEach(button => {
   Object.defineProperties(Button.prototype, {
      [button]: {
         value: function (props) {
            return this.set_type(button);
         }
      }
   });
});