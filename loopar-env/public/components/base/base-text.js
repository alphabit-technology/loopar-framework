import Component from "./component.js";
export default class BaseText extends Component {
   dontHaveMetaElements = ["label"];
   defaultText = "Text here";

   constructor(props) {
      super(props);
   }

   /*componentDidMount(prevProps, prevState, snapshot) {
      super.componentDidMount(prevProps, prevState, snapshot);
      const meta = this.props.meta;

      setTimeout(() => {
         if (!meta.data.text) {
            this.props.designerRef.updateElement(meta.data.key, {
               text: this.defaultText
            }, true);
         }
      }, 100);
   }*/

   getText() {
      return this.props.meta.data.text || this.defaultText;
   }
}