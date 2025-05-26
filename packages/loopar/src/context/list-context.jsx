import BaseDocument from "@context/base/base-document";
import DeskGUI from "@context/base/desk-gui";
import { ListGrid } from "@@table/ListGrid";
import {useCookies} from "@services/cookie";
import {GridView} from "@@table/GridView";
import { TableProvider } from "@@table/TableContext";

function ListContextMildware({content, meta, docRef, hasSearchForm = true, onlyGrid}){
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
    >
      {content}
      {(
        <TableProvider initialMeta={meta} docRef={docRef} rows={meta.rows}>
          {getViewType() === 'List' ? (
            <ListGrid
              hasSearchForm={hasSearchForm}
              docRef={docRef}
            />
          ) : (
            <GridView
              hasSearchForm={hasSearchForm}
              docRef={docRef}
            />
          )}
        </TableProvider>
      )}
    </DeskGUI>
  )
}

export default class ListContext extends BaseDocument {
  hasHeader = true;
  hasSidebar = true;
  context = 'index';
  renderStructure = false;
  hasSearchForm = true;
  hasSelectAll = true;
  hasSelectRow = true;

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