import Component from "./component.js";
export default class BaseTextBlock extends Component{
   defaultDescription = "I'm a awesome Text Block widget, you can customize in edit button in design mode.";
   constructor(props) {
      super(props);
   }

   componentDidMount(){
      super.componentDidMount();
      const meta = this.props.meta;

      setTimeout(() => {
         if(!meta.data.description || !meta.data.label){
            this.props.designerRef.updateElement(meta.data.name, {
               name: meta.data.name,
               description: meta.data.description || this.defaultDescription,
               label: meta.data.label || "Text Block"
            }, true);
         }
      }, 100);
   }
}