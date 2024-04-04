import BaseDocument from "$context/base/base-document";
import DynamicComponent from "$dynamic-component";
import DeskGUI from "@context/base/desk-gui";

export default class View extends BaseDocument {
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;

  constructor(props) {
    super(props);
  }

  render(content) {
    const meta = this.props.meta;
    const {STRUCTURE} = meta.__DOCTYPE__;


    console.log(['STRUCTURE', meta]);
    return super.render(
      <DeskGUI
        docRef={this}
      >
        <>
        <DynamicComponent elements={JSON.parse(meta.__DOCTYPE__.doc_structure)} parent={this}/>
        {content}
        </>
      </DeskGUI>
      /*DeskGUI({
         docRef: this
      }, [
         ...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element, {
               meta: {
                  ...el,
               },
            })
         }),
         content
      ])*/
    );
  }
}