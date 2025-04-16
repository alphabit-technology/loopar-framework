import BaseDocument from "@context/base/base-document";
import DeskGUI from "@context/base/desk-gui";
import { ListGrid } from "@@table/ListGrid";
import {useCookies} from "@services/cookie";

function ListContextMildware({content, meta, docRef, hasSearchForm = true, renderGrid, onlyGrid}){
  const {__ENTITY__} = meta;
  const [viewType, setViewType] = useCookies(__ENTITY__.name + "_viewType") || __ENTITY__.default_list_view || "List";

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
      <ListContextMildware
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