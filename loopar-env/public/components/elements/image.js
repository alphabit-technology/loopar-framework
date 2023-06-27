import {image, div} from "../elements.js";
import Component from "../base/component.js";
import { fileManager } from "../tools/file-manager.js";


export default class Image extends Component {
   style= {
      position: "relative",
      width: "100%",
      backgroundColor: "var(--secondary)",
      paddingTop: "56.25%",
      overflow: "hidden",
      /*backgroundImage: `url(${this.getSrc() || "/uploads/empty-image.svg"})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",*/
   }

   insideBackGround = true;

   constructor(props){
      super(props);

      this.state = {
         ...this.state,
         src: null
      }
   }

   componentDidUpdate(prevProps, prevState){
      super.componentDidUpdate(prevProps, prevState);
      if(prevProps.meta.data.background_image !== this.props.meta.data.background_image){
         this.setState({
            src: this.getSrc() || "/uploads/empty-image.svg",
         })
      }
   }

   /*getSrc(){
      const designer = this.props.designer;
      const background = this.props.meta.data.background_image;
      const background_image = Array.isArray(background) ? background[0] : background// //fileManager.get(background);
      const src = typeof background_image === 'object' ? background_image.src : background_image;
      return this.props.src || src
   }*/

   render(){
      const {color_overlay={}} = this.props.meta.data;
      const {color, alpha} = color_overlay;

      return super.render([
          image({
             style: {
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                width: "100%",
                height: "100%",
                objectFit: this.props.meta.data.background_size || "cover",
             },
             ...this.backGround(true),
          }),
         div({
            style: {
               position: "absolute",
               top: 0, left: 0, right: 0, bottom: 0,
               borderRadius: "0.25rem",
               overflow: "hidden",
               backgroundColor: color || "rgba(0,0,0,0.5)",
               opacity: alpha || 0
            }
         })
      ])
   /*return super.render([
      image({
         src: this.getSrc() || "/uploads/empty-image.svg",
         ...this.props,
         ...{
            className: "img-fluid mb-4 mb-md-0",
               width: "100%", height: "100%"
            },
            style: {
               opacity: 0
            }
         }),

         div({
            className: "img-fluid mb-4 mb-md-0",
            style: {
               backgroundImage: `url(${this.getSrc() || "/uploads/empty-image.svg"})`,
               backgroundSize: "cover",
               backgroundRepeat: "no-repeat",
               position: "absolute",
               top: 0, left: 0, right: 0, bottom: 0,
               zIndex: 9,
               borderRadius: "0.25rem",
            }
         })
      ]);*/
   }
}