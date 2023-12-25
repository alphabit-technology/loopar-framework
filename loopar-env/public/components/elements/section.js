import { div } from "../elements.js";
import Component from "../base/component.js";

export default class Section extends Component {
   blockComponent = true;
   className = "section position-relative py-5 bg-light h-100";

   constructor(props) {
      super(props);
   }

   /*getSrc() {
      const designer = this.props.designer;
      const background = this.props.meta.data.background_image;
      const background_image = Array.isArray(background) ? background[0] : background;// //fileManager.get(background);
      const src = typeof background_image === 'object' ? background_image.src : background_image;
      return this.props.src || src
   }*/

   render(content = null) {
      //const data = this.props.meta.data || {};

      /*if (data.background_image) {
         this.style = {
            backgroundImage: `url(${this.getSrc() || ""}`,
            backgroundSize: data.background_size || "cover",
            backgroundPosition: data.background_position || "center",
            backgroundRepeat: data.background_repeat || "no-repeat",
         }
      }*/

      return super.render([
         /*div({
               className: "element container position-relative",
               ref: self => this.container = self,
               component: this
            }, [
               content || this.last_state().children,
               ...this.elements
         ])*/
         div({ className: "container position-relative h-100" }, [
            div({
               className: "element align-items-center justify-content-between element sub-element h-100",
               ref: self => this.container = self,
               Component: this
            }, [
               this.props.children,
               content,
               ...this.elements
            ])
         ])
      ]);
   }
}