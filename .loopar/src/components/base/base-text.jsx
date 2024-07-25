export default function BaseText(props) {
  const defaultText = "Text here";


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

  const getText = () => {
    return props.data.text || defaultText;
  }

  return {getText}
}

BaseText.dontHaveMetaElements = ["label"];
