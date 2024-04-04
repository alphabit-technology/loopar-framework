import elementManage from "$tools/element-manage";
import Component from "$component";

export default class Preassembled extends Component {
  defaultText = "I'm a awesome Text Block widget, you can customize in edit button in design mode.";
  tagName = "div";
  /*defaultElements = [
     {
        element: "title",
        meta:{
           data: {
              name: "text_block_title",
              id: "text_block_title",
              label: "Text Block Title",
              key: "text_block_title",
           }
        },
        //key: elementName.id,
        designer: true,
        hasTitle: true,
     }
  ]*/

  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    if ((!this.props.elements || this.props.elements?.length === 0) && this.props.designer) {
      const prepareElements = (elements) => {
        return elements.map(el => {
          el.data ??= {};
          el.designer = true;
          el.hasTitle = true;
          el.data.key ??= elementManage.getUniqueKey();

          if (el.elements?.length > 0) {
            el.elements = prepareElements(el.elements);
          }
          return el;
        });
      }

      this.setElements(prepareElements(this.defaultElements || []), null, false);
    }
  }
}