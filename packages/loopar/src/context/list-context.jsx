import BaseDocument from "@context/base/base-document";
import DeskGUI from "@context/base/desk-gui";
import { ListGrid } from "@list-grid";
import {useCookies} from "@services/cookie";

function ListContextFn({isModal, content, meta, docRef, hasSearchForm = true, renderGrid, onlyGrid, ...props}){
  const [viewType, setViewType] = useCookies(meta.__ENTITY__.name + "_viewType") || meta.__ENTITY__.default_list_view || "List";

  const getViewType = () => {
    return onlyGrid === true ? "Grid" : viewType;
  }

  const viewTypeToggle = () => {
    setViewType(viewType === 'List' ? 'Grid' : 'List');
  }

  return (
   <DeskGUI
      docRef={docRef}
      viewTypeToggle={viewTypeToggle}
      viewType={getViewType()}
    >
      {content}
      {(!content || renderGrid) && (
        <ListGrid
          hasSearchForm={hasSearchForm}
          meta={meta}
          viewType={getViewType()}
          viewTypeToggle={viewTypeToggle}
          docRef={docRef}
        />
      )}
    </DeskGUI>
  )
}

export default class ListContext extends BaseDocument {
  hasHeader = true;
  hasSidebar = true;
  context = 'index';
  renderStructure = false;

  render(content) {
    return super.render(
      <ListContextFn
        content={content}
        meta={this.props.meta} 
        hasSearchForm={this.hasSearchForm}
        renderGrid={this.renderGrid}
        docRef={this}
        onlyGrid={this.onlyGrid}
      />
    )
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }
}