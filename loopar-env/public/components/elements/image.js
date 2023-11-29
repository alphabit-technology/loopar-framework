import {image, Div} from "../elements.js";
import Component from "../base/component.js";
import { loopar } from "../../loopar.js";

export default class Image extends Component {
   style = {
      //position: "relative",
      //width: "100%",
      top: 0,//, left: 0, right: 0, bottom: 0,
      //backgroundColor: "var(--secondary)",
      paddingTop: "60%",
      //overflow: "hidden"
   }
   //className = "image";

   //insideBackGround = true;

   //dontHaveContainer = true;
   //dontHaveBackground = true;

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

   render(){
      const data = this.props.meta?.data || {};
      const color = loopar.utils.rgba(data.color_overlay);

      //this.className = this.className +  " " + data.class || "position-relative w-100 h-100";
      

      return super.render([
         image({
            style: {
               position: "absolute",
               top: 0, left: 0, right: 0, bottom: 0,
               width: "100%",
               height: "100%",
               objectFit: data.background_size || "cover",
               borderRadius: "0.25rem",
            },
            ...this.backGround(true),
         }),
         Div({
            style: {
               position: "absolute",
               width: "100%",
               height: "100%",
               top: 0, left: 0, right: 0, bottom: 0,
               borderRadius: "0.25rem",
               overflow: "hidden",
               ...(color ? {backgroundColor: color} : {}),
               borderRadius: 0
            },
            className: data.class
         })
      ]);
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
   }
}