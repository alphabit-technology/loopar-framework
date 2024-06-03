import BaseDocument from "$context/base/base-document";
import MetaComponent from "@meta-component";

export default class WebContext extends BaseDocument {
  constructor(props) {
    super(props);
  }

  render(content = []) {
    return super.render([
      <MetaComponent elements={JSON.parse(this.meta.__DOCTYPE__.doc_structure)} parent={this}/>,
      content
    ]);
  }

  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }

  /*getPageKey() {
    return this.meta.key;
  }*/

  /*getCurrentScrollPosition() {
    return loopar.cookie.get(this.getPageKey()) || window.scrollY || window.pageYOffset;
  }*/

  /*initScroll() {
    const scrollPosition = loopar.cookie.get(this.getPageKey()) || 0;

    window.scrollTo(0, scrollPosition);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }*/

  /*setScrollPosition() {
    loopar.cookie.set(this.getPageKey(), window.scrollY || window.pageYOffset);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }

  handleBeforeUnload = () => {
    this.setScrollPosition();
  };*/
}