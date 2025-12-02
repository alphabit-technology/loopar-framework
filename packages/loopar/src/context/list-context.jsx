import BaseDocument from "@context/base/base-document";
import DeskGUI from "@context/base/desk-gui";
import { ListGrid } from "@@table/ListGrid";
import {useCookies} from "@services/cookie";
import {GridView} from "@@table/GridView";
import { TableProvider } from "@@table/TableContext";

function ListContextMildware({content, Document, docRef, hasSearchForm = true, onlyGrid, onlyList}){
  const [viewType, setViewType] = useCookies(Document.Entity.name + "_viewType") || Document.Entity.default_list_view || "List";

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
        <TableProvider initialDocument={Document} docRef={docRef} rows={Document.rows}>
          {getViewType() === 'List' || onlyList ? (
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
        Document={this.Document} 
        hasSearchForm={this.hasSearchForm}
        renderGrid={this.renderGrid}
        docRef={this}
        onlyGrid={this.onlyGrid}
        onlyList={this.onlyList}
      />
    )
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }
}