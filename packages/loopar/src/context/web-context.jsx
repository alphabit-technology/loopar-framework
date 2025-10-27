import BaseDocument from "@context/base/base-document";
import MetaComponent from "@meta-component";

const WebContextLayout = ({children}) => {
  return (
    <div>
      {children}
    </div>
  );
}

export default class WebContext extends BaseDocument {
  constructor(props) {
    super(props);
  }

  render(content = []) {
    return super.render(
      <>
      <MetaComponent elements={JSON.parse(this.Document.__ENTITY__.doc_structure)} parent={this}/>
      {content}
      </>
    );
  }

  componentDidMount() {
    super.componentDidMount();
    //this.initScroll();
  }
}