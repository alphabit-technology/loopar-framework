import Component from "#component";

export default class BaseTextBlock extends Component {
   dontHaveMetaElements = [];
   defaultLabel = "Text block";
   defaultText = "I'm a awesome Text Block widget, you can customize in edit button in design mode.";

   constructor(props) {
      super(props);
   }

   componentDidMount(prevProps, prevState, snapshot) {
      super.componentDidMount(prevProps, prevState, snapshot);
      const meta = this.props.meta;

      setTimeout(() => {
         if (!meta.data.text) {
            this.props.designerRef.updateElement(meta.data.key, {
               label: this.defaultLabel,
               text: this.defaultText,
            }, true);
         }
      }, 100);
   }

   getText() {
      return this.props.meta.data.text || this.defaultText;
   }
}