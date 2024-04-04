import BaseDocument from "@context/base/base-document";
import loopar from "$loopar";
import DeskGUI from "@context/base/desk-gui";
import { ListGrid } from "@list-grid";

export default class ListContext extends BaseDocument {
  hasHeader = true;
  hasSidebar = true;
  context = 'index';
  renderStructure = false;

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      viewType: loopar.utils.cookie.get(this.props.meta.__DOCTYPE__.name + "_viewType") || this.props.meta.__DOCTYPE__.default_list_view || "List"
      //viewType: localStorage.getItem(props.__DOCTYPE__.name + "_viewType") || props.__DOCTYPE__.default_list_view || "List"
    };
  }


  get viewType() {
    return this.onlyGrid === true ? "Grid" : this.state.viewType;
  }

  render(content) {
    content = [
      content,
      !content || this.renderGrid ?
        <ListGrid
          meta={this.props.meta}
          viewType={this.viewType}
          docRef={this}
          ref={(grid) => {
            this.grid = grid;
          }}
        /> : null
      /*!content || this.renderGrid ? ListGrid({
         meta: this.props,
         viewType: this.viewType,
         docRef: this,
         ref: (grid) => {
            this.grid = grid;
         }
      }) : null*/
    ];

    return super.render(
      this.props.modal ? content :
        <DeskGUI
          docRef={this}
        >
          {content}
        </DeskGUI>
    );
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }
}