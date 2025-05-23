import { useTable } from "./TableContext";
import { Pagination } from "./pagination.jsx";

import {SimpleTable} from "./SimpleTable";
function BaseTable(props) {
  const rows = props.rows || useTable().rows || [];

  return (
    <>
      <div className="border">
        <SimpleTable
          rows={rows}
          columns={props.columns}
          footer={props.footer}
          rowTemplate={props.rowTemplate}
        />
      </div>
      <div className="mt-3">
        <Pagination />
        {props.footer}
      </div>
    </>
  );
}

export default BaseTable;