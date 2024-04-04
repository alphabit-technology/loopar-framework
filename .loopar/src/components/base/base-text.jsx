import Component from "$component";

export default class BaseText extends Component {
  dontHaveMetaElements = ["label"];
  defaultText = "Text here";

  /*componentDidMount(prevProps, prevState, snapshot) {
      super.componentDidMount(prevProps, prevState, snapshot);
      const meta = this.props;

      setTimeout(() => {
         if (!meta.data.text) {
            this.props.designerRef.updateElement(meta.data.key, {
               text: this.defaultText
            }, true);
         }
      }, 100);
   }*/

  getText() {
    return this.props.data.text || this.defaultText;
  }
}
