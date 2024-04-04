import BaseDocument from "$context/base/base-document";
import DynamicComponent from "$dynamic-component";
import loopar from "$loopar";

export default class WebContext extends BaseDocument {
  constructor(props) {
    super(props);
  }

  render(content = []) {
    return super.render([
      <DynamicComponent elements={JSON.parse(this.meta.__DOCTYPE__.doc_structure)} parent={this} />,
      content
    ]);
  }

  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }

  getPageKey() {
    return this.meta.key;
  }

  getCurrentScrollPosition() {
    return loopar.utils.cookie.get(this.getPageKey()) || window.scrollY || window.pageYOffset;
  }

  initScroll() {
    const scrollPosition = loopar.utils.cookie.get(this.getPageKey()) || 0;

    window.scrollTo(0, scrollPosition);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  setScrollPosition() {
    loopar.utils.cookie.set(this.getPageKey(), window.scrollY || window.pageYOffset);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }

  handleBeforeUnload = () => {
    this.setScrollPosition();
  };
}